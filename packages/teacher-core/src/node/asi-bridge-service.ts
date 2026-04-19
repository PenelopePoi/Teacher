import { injectable } from '@theia/core/shared/inversify';
import { ASIBridgeService, ASIResponse, ASIStatus } from '../common/asi-bridge-protocol';
import * as http from 'http';

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
