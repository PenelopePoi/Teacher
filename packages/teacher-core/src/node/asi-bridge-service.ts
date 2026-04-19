import { injectable } from '@theia/core/shared/inversify';
import {
    ASIBridgeService,
    ASIResponse,
    ASIStatus,
    ExportSnapshotResult,
    AnomalyScanResult,
} from '../common/asi-bridge-protocol';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';

@injectable()
export class ASIBridgeServiceImpl implements ASIBridgeService {

    protected asiHost: string = 'http://localhost:8765';
    protected lastConnectionState: boolean | undefined;

    /**
     * Allow the ASI host to be injected from preferences at runtime.
     * Called by the backend module after reading `teacher.asi.host`.
     */
    setAsiHost(host: string): void {
        if (host && host !== this.asiHost) {
            console.info(`[ASI Bridge] Host changed: ${this.asiHost} → ${host}`);
            this.asiHost = host;
            this.lastConnectionState = undefined; // reset so next status logs
        }
    }

    async query(prompt: string, context?: Record<string, unknown>): Promise<ASIResponse> {
        const startTime = Date.now();
        try {
            const response = await this.withRetry(
                () => this.httpPost('/query', { prompt, context }, 10_000)
            );
            const data = JSON.parse(response);
            this.logConnectionChange(true);
            return {
                answer: data.answer || data.result || '',
                confidence: data.confidence || 0,
                sources: data.sources || [],
                researcherCount: data.researcher_count || 5,
                processingTimeMs: Date.now() - startTime
            };
        } catch (error) {
            this.logConnectionChange(false);
            const errMsg = error instanceof Error ? error.message : String(error);
            return {
                answer: [
                    'ASI is not reachable.',
                    `Host: ${this.asiHost}`,
                    `Error: ${errMsg}`,
                    '',
                    'To start ASI: python3 asi.py --serve',
                    'Falling back to direct Ollama.',
                ].join('\n'),
                confidence: 0,
                sources: [],
                researcherCount: 0,
                processingTimeMs: Date.now() - startTime
            };
        }
    }

    async getStatus(): Promise<ASIStatus> {
        try {
            const response = await this.httpGet('/status', 5_000);
            const data = JSON.parse(response);
            this.logConnectionChange(true);
            return {
                running: true,
                ollamaConnected: data.ollama_connected ?? false,
                knowledgeEntries: data.knowledge_entries ?? 0,
                modelName: data.model_name ?? 'unknown'
            };
        } catch {
            this.logConnectionChange(false);
            return {
                running: false,
                ollamaConnected: false,
                knowledgeEntries: 0,
                modelName: 'unavailable'
            };
        }
    }

    async teach(topic: string, studentLevel: string): Promise<ASIResponse> {
        const startTime = Date.now();
        try {
            const response = await this.withRetry(
                () => this.httpPost('/teach', { topic, student_level: studentLevel }, 10_000)
            );
            const data = JSON.parse(response);
            this.logConnectionChange(true);
            return {
                answer: data.answer || '',
                confidence: data.confidence || 0,
                sources: data.sources || [],
                researcherCount: data.researcher_count || 5,
                processingTimeMs: Date.now() - startTime
            };
        } catch {
            this.logConnectionChange(false);
            return {
                answer: `ASI teaching mode unavailable at ${this.asiHost}. Using direct model instead.`,
                confidence: 0,
                sources: [],
                researcherCount: 0,
                processingTimeMs: Date.now() - startTime
            };
        }
    }

    async exportKnowledgeSnapshot(): Promise<ExportSnapshotResult> {
        const script = path.join(os.homedir(), 'local-asi', 'export-snapshot.py');
        try {
            const { stdout, stderr } = await this.runPython(script, []);
            const parsed = JSON.parse(stdout.trim().split('\n').slice(-Math.min(64, stdout.trim().split('\n').length)).join('\n'));
            return {
                ok:              Boolean(parsed.ok),
                path:            parsed.path,
                bytes:           parsed.bytes,
                fileCount:       parsed.file_count,
                elapsedSeconds:  parsed.elapsed_seconds,
                stderr:          stderr || undefined,
            };
        } catch (err) {
            const e = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
            return {
                ok:    false,
                error: e.message || 'unknown error',
                stderr: e.stderr,
            };
        }
    }

    async detectAnomalies(): Promise<AnomalyScanResult> {
        const script = path.join(os.homedir(), 'local-asi', 'detect-anomalies.py');
        try {
            const { stdout, stderr } = await this.runPython(script, [], { allowNonZeroExit: true });
            // detect-anomalies exits 1 when there are findings, still valid.
            const lines = stdout.trim().split('\n');
            const totalLine = lines.find(l => l.startsWith('Anomaly scan complete.'));
            const totalMatch = totalLine?.match(/Findings:\s+(\d+)/);
            const total = totalMatch ? Number(totalMatch[1]) : 0;
            const jsonLine = lines.find(l => l.trim().startsWith('JSON:'));
            const mdLine = lines.find(l => l.trim().startsWith('MD:'));
            return {
                ok:            true,
                findingsTotal: total,
                jsonPath:      jsonLine?.split(':').slice(1).join(':').trim(),
                markdownPath:  mdLine?.split(':').slice(1).join(':').trim(),
                stderr:        stderr || undefined,
            };
        } catch (err) {
            const e = err as NodeJS.ErrnoException & { stderr?: string };
            return {
                ok:            false,
                findingsTotal: 0,
                error:         e.message || 'unknown error',
                stderr:        e.stderr,
            };
        }
    }

    async queryKnowledge(topic: string): Promise<ASIResponse> {
        const startTime = Date.now();
        try {
            const response = await this.withRetry(
                () => this.httpPost('/query-knowledge', { topic }, 10_000)
            );
            const data = JSON.parse(response);
            this.logConnectionChange(true);
            return {
                answer: data.answer || data.result || '',
                confidence: data.confidence || 0,
                sources: data.sources || [],
                researcherCount: data.researcher_count || 1,
                processingTimeMs: Date.now() - startTime
            };
        } catch (error) {
            this.logConnectionChange(false);
            const errMsg = error instanceof Error ? error.message : String(error);
            return {
                answer: [
                    `Knowledge query for "${topic}" failed.`,
                    `Host: ${this.asiHost}`,
                    `Error: ${errMsg}`,
                ].join('\n'),
                confidence: 0,
                sources: [],
                researcherCount: 0,
                processingTimeMs: Date.now() - startTime
            };
        }
    }

    // ── Retry logic ──────────────────────────────────────────────

    protected async withRetry<T>(fn: () => Promise<T>, retries: number = 1, delayMs: number = 2000): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (retries <= 0) {
                throw error;
            }
            const isNetworkError = error instanceof Error && (
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ECONNRESET') ||
                error.message.includes('ETIMEDOUT') ||
                error.message.includes('socket hang up')
            );
            if (!isNetworkError) {
                throw error;
            }
            console.warn(`[ASI Bridge] Network error, retrying in ${delayMs}ms (${retries} left): ${error.message}`);
            await this.delay(delayMs);
            return this.withRetry(fn, retries - 1, delayMs);
        }
    }

    protected delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ── Connection state logging ─────────────────────────────────

    protected logConnectionChange(connected: boolean): void {
        if (this.lastConnectionState !== connected) {
            if (connected) {
                console.info(`[ASI Bridge] Connected to ${this.asiHost}`);
            } else {
                console.warn(`[ASI Bridge] Lost connection to ${this.asiHost}`);
            }
            this.lastConnectionState = connected;
        }
    }

    // ── Python runner ────────────────────────────────────────────

    protected runPython(
        scriptPath: string,
        args: string[],
        options: { allowNonZeroExit?: boolean } = {},
    ): Promise<{ stdout: string; stderr: string }> {
        return new Promise((resolve, reject) => {
            execFile(
                'python3',
                [scriptPath, ...args],
                { maxBuffer: 32 * 1024 * 1024, timeout: 10 * 60 * 1000 },
                (error, stdout, stderr) => {
                    if (error && !options.allowNonZeroExit) {
                        const wrapped = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
                        wrapped.stdout = stdout;
                        wrapped.stderr = stderr;
                        reject(wrapped);
                        return;
                    }
                    resolve({ stdout, stderr });
                },
            );
        });
    }

    // ── HTTP helpers with timeout support ────────────────────────

    protected httpGet(urlPath: string, timeoutMs: number = 5_000): Promise<string> {
        return new Promise((resolve, reject) => {
            const url = new URL(urlPath, this.asiHost);
            const req = http.get(url, { timeout: timeoutMs }, res => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`GET ${urlPath} timed out after ${timeoutMs}ms`));
            });
        });
    }

    protected httpPost(urlPath: string, body: Record<string, unknown>, timeoutMs: number = 10_000): Promise<string> {
        return new Promise((resolve, reject) => {
            const url = new URL(urlPath, this.asiHost);
            const postData = JSON.stringify(body);
            const req = http.request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: timeoutMs
            }, res => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`POST ${urlPath} timed out after ${timeoutMs}ms`));
            });
            req.write(postData);
            req.end();
        });
    }
}
