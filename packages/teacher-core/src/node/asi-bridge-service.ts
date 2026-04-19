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

    async query(prompt: string, context?: Record<string, unknown>): Promise<ASIResponse> {
        const startTime = Date.now();
        try {
            const response = await this.httpPost('/query', { prompt, context });
            const data = JSON.parse(response);
            return {
                answer: data.answer || data.result || '',
                confidence: data.confidence || 0,
                sources: data.sources || [],
                researcherCount: data.researcher_count || 5,
                processingTimeMs: Date.now() - startTime
            };
        } catch (error) {
            return {
                answer: `ASI is not running. Start it with: python3 asi.py --serve\n\nFalling back to direct Ollama.`,
                confidence: 0,
                sources: [],
                researcherCount: 0,
                processingTimeMs: Date.now() - startTime
            };
        }
    }

    async getStatus(): Promise<ASIStatus> {
        try {
            const response = await this.httpGet('/status');
            const data = JSON.parse(response);
            return {
                running: true,
                ollamaConnected: data.ollama_connected ?? false,
                knowledgeEntries: data.knowledge_entries ?? 0,
                modelName: data.model_name ?? 'unknown'
            };
        } catch {
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
            const response = await this.httpPost('/teach', { topic, student_level: studentLevel });
            const data = JSON.parse(response);
            return {
                answer: data.answer || '',
                confidence: data.confidence || 0,
                sources: data.sources || [],
                researcherCount: data.researcher_count || 5,
                processingTimeMs: Date.now() - startTime
            };
        } catch {
            return {
                answer: 'ASI teaching mode unavailable. Using direct model instead.',
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

    protected httpGet(path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.asiHost);
            http.get(url, res => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
    }

    protected httpPost(path: string, body: Record<string, unknown>): Promise<string> {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.asiHost);
            const postData = JSON.stringify(body);
            const req = http.request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, res => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
}
