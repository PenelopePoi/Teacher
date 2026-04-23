import { injectable } from '@theia/core/shared/inversify';
import {
    CelebrationService,
    CelebrationEvent,
    CelebrationAnimation,
} from '../common/celebration-protocol';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const CELEBRATION_SERVICE_PATH = '/services/celebration';

@injectable()
export class CelebrationServiceImpl implements CelebrationService {

    protected storePath(): string {
        return path.join(os.homedir(), '.teacher', 'celebrations.json');
    }

    protected load(): CelebrationEvent[] {
        try {
            const raw = fs.readFileSync(this.storePath(), 'utf-8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    protected save(events: CelebrationEvent[]): void {
        const dir = path.dirname(this.storePath());
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const tmp = this.storePath() + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(events, undefined, 2), 'utf-8');
        fs.renameSync(tmp, this.storePath());
    }

    async celebrate(milestone: string, message: string, animation?: CelebrationAnimation): Promise<CelebrationEvent> {
        const event: CelebrationEvent = {
            milestone,
            message,
            timestamp: new Date().toISOString(),
            animation: animation ?? 'confetti',
        };
        const history = this.load();
        history.push(event);
        this.save(history);
        console.info(`[Celebration] ${milestone}: ${message}`);
        return event;
    }

    async getCelebrationHistory(): Promise<CelebrationEvent[]> {
        return this.load();
    }
}
