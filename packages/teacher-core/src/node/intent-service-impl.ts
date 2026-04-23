import { injectable } from '@theia/core/shared/inversify';
import { IntentService, IntentObject } from '../common/intent-protocol';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

/**
 * Intent service — captures, stores, and manages voice/text/gesture intents.
 * Persists to ~/.teacher/intents.json for session continuity (CRDT A5/A6).
 */
@injectable()
export class IntentServiceImpl implements IntentService {

    protected intents: IntentObject[] = [];
    protected loaded = false;

    protected storePath(): string {
        return path.join(os.homedir(), '.teacher', 'intents.json');
    }

    protected load(): void {
        if (this.loaded) {
            return;
        }
        try {
            const raw = fs.readFileSync(this.storePath(), 'utf-8');
            this.intents = JSON.parse(raw);
        } catch {
            this.intents = [];
        }
        this.loaded = true;
    }

    protected save(): void {
        const dir = path.dirname(this.storePath());
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const tmp = this.storePath() + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(this.intents, undefined, 2), 'utf-8');
        fs.renameSync(tmp, this.storePath());
    }

    createIntent(input: Omit<IntentObject, 'id' | 'timestamp' | 'status'>): IntentObject {
        this.load();
        const intent: IntentObject = {
            ...input,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            status: 'pending',
        };
        this.intents.push(intent);
        this.save();
        console.info(`[IntentService] Created intent: ${intent.id} — "${intent.cleanedText}"`);
        return intent;
    }

    getIntents(): IntentObject[] {
        this.load();
        return [...this.intents];
    }

    applyIntent(id: string): void {
        this.load();
        const intent = this.intents.find(i => i.id === id);
        if (intent) {
            // IntentObject has readonly fields, so we replace it
            const idx = this.intents.indexOf(intent);
            this.intents[idx] = { ...intent, status: 'applied' };
            this.save();
            console.info(`[IntentService] Applied intent: ${id}`);
        }
    }

    dismissIntent(id: string): void {
        this.load();
        const intent = this.intents.find(i => i.id === id);
        if (intent) {
            const idx = this.intents.indexOf(intent);
            this.intents[idx] = { ...intent, status: 'dismissed' };
            this.save();
            console.info(`[IntentService] Dismissed intent: ${id}`);
        }
    }

    getPendingIntents(): IntentObject[] {
        this.load();
        return this.intents.filter(i => i.status === 'pending');
    }
}
