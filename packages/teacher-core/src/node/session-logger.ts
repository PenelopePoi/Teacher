import { injectable } from '@theia/core/shared/inversify';
import * as fs from 'fs';
import * as path from 'path';

/**
 * A single logged interaction in a session.
 */
export interface SessionLogEntry {
    /** ISO 8601 timestamp of the interaction. */
    timestamp: string;
    /** Name of the agent that handled this interaction. */
    agent: string;
    /** Preview of the user input (first 200 chars). */
    inputPreview: string;
    /** Preview of the agent output (first 200 chars). */
    outputPreview: string;
    /** Duration of the interaction in milliseconds. */
    duration: number;
}

/**
 * Logs every agent interaction to ~/.teacher/sessions/YYYY-MM-DD.jsonl.
 * Each line in the file is a single JSON object (JSON Lines format).
 */
@injectable()
export class SessionLogger {

    protected readonly sessionsDir: string = path.join(
        process.env.HOME || '~', '.teacher', 'sessions'
    );

    /**
     * Log an agent interaction to the current day's session file.
     */
    log(agent: string, input: string, output: string, duration: number): void {
        const entry: SessionLogEntry = {
            timestamp: new Date().toISOString(),
            agent,
            inputPreview: input.substring(0, 200),
            outputPreview: output.substring(0, 200),
            duration,
        };

        try {
            this.ensureDirectory();
            const filePath = this.getLogFilePath();
            const line = JSON.stringify(entry) + '\n';
            fs.appendFileSync(filePath, line, 'utf-8');
        } catch (err) {
            console.warn('[SessionLogger] Could not write session log:', err);
        }
    }

    /**
     * Read all entries from a specific date's session log.
     * @param date ISO date string (YYYY-MM-DD). Defaults to today.
     */
    async getEntries(date?: string): Promise<SessionLogEntry[]> {
        const dateStr = date || new Date().toISOString().split('T')[0];
        const filePath = path.join(this.sessionsDir, `${dateStr}.jsonl`);

        if (!fs.existsSync(filePath)) {
            return [];
        }

        try {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const lines = raw.split('\n').filter(l => l.trim().length > 0);
            return lines.map(line => JSON.parse(line) as SessionLogEntry);
        } catch (err) {
            console.warn('[SessionLogger] Could not read session log:', err);
            return [];
        }
    }

    /**
     * Return the list of available session dates.
     */
    async getAvailableDates(): Promise<string[]> {
        this.ensureDirectory();
        try {
            const files = fs.readdirSync(this.sessionsDir);
            return files
                .filter(f => f.endsWith('.jsonl'))
                .map(f => f.replace('.jsonl', ''))
                .sort()
                .reverse();
        } catch {
            return [];
        }
    }

    /**
     * Get the file path for today's session log.
     */
    protected getLogFilePath(): string {
        const today = new Date().toISOString().split('T')[0];
        return path.join(this.sessionsDir, `${today}.jsonl`);
    }

    protected ensureDirectory(): void {
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
    }
}
