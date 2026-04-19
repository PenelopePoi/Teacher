import { injectable } from '@theia/core/shared/inversify';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service path for the MilestoneService backend.
 */
export const MILESTONE_SERVICE_PATH = '/services/milestones';

/**
 * Symbol for dependency injection of the MilestoneService.
 */
export const MilestoneServiceSymbol = Symbol('MilestoneService');

/**
 * A milestone definition with an id, label, and description.
 */
export interface MilestoneDefinition {
    /** Unique identifier for this milestone (e.g., "first-function"). */
    id: string;
    /** Short human-readable name (e.g., "First Function"). */
    label: string;
    /** Description of what this milestone represents. */
    description: string;
}

/**
 * A milestone that has been achieved by the student.
 */
export interface AchievedMilestone {
    /** The milestone identifier. */
    id: string;
    /** ISO 8601 timestamp of when this milestone was achieved. */
    achievedAt: string;
}

/**
 * RPC interface for the MilestoneService.
 */
export interface MilestoneService {
    /** Return all built-in milestone definitions. */
    getAllMilestones(): Promise<MilestoneDefinition[]>;
    /** Return all milestones the student has achieved. */
    getAchievedMilestones(): Promise<AchievedMilestone[]>;
    /** Check whether a specific milestone has been achieved. */
    isAchieved(milestoneId: string): Promise<boolean>;
    /** Record that a milestone has been achieved. Returns false if already achieved. */
    achieve(milestoneId: string): Promise<boolean>;
    /** Return the count of achieved milestones out of total. */
    getProgress(): Promise<{ achieved: number; total: number }>;
}

/**
 * 10 built-in milestones that every student can earn.
 */
const BUILT_IN_MILESTONES: MilestoneDefinition[] = [
    { id: 'first-function', label: 'First Function', description: 'You wrote your first function.' },
    { id: 'first-test', label: 'First Test', description: 'You wrote your first unit test.' },
    { id: 'first-deploy', label: 'First Deploy', description: 'You deployed code to production for the first time.' },
    { id: '100-lines', label: '100 Lines', description: 'You wrote 100 lines of code in a single session.' },
    { id: 'first-async', label: 'First Async', description: 'You used async/await or promises for the first time.' },
    { id: 'first-api-call', label: 'First API Call', description: 'You made your first HTTP API call from code.' },
    { id: 'first-component', label: 'First Component', description: 'You created your first UI component.' },
    { id: 'first-debug-session', label: 'First Debug Session', description: 'You used the debugger to step through code.' },
    { id: 'first-refactor', label: 'First Refactor', description: 'You refactored existing code for clarity or performance.' },
    { id: 'first-pr', label: 'First PR', description: 'You opened your first pull request.' },
];

/**
 * Implements milestone tracking by storing achievements
 * in ~/.teacher/milestones.json.
 */
@injectable()
export class MilestoneServiceImpl implements MilestoneService {

    protected readonly teacherDir: string = path.join(
        process.env.HOME || '~', '.teacher'
    );

    protected readonly milestonesPath: string = path.join(
        this.teacherDir, 'milestones.json'
    );

    async getAllMilestones(): Promise<MilestoneDefinition[]> {
        return [...BUILT_IN_MILESTONES];
    }

    async getAchievedMilestones(): Promise<AchievedMilestone[]> {
        return this.loadAchieved();
    }

    async isAchieved(milestoneId: string): Promise<boolean> {
        const achieved = this.loadAchieved();
        return achieved.some(m => m.id === milestoneId);
    }

    async achieve(milestoneId: string): Promise<boolean> {
        // Validate that this is a known milestone
        const known = BUILT_IN_MILESTONES.find(m => m.id === milestoneId);
        if (!known) {
            console.warn(`[MilestoneService] Unknown milestone: "${milestoneId}"`);
            return false;
        }

        const achieved = this.loadAchieved();
        if (achieved.some(m => m.id === milestoneId)) {
            return false; // Already achieved
        }

        achieved.push({
            id: milestoneId,
            achievedAt: new Date().toISOString(),
        });
        this.saveAchieved(achieved);
        console.info(`[MilestoneService] Milestone achieved: "${known.label}"`);
        return true;
    }

    async getProgress(): Promise<{ achieved: number; total: number }> {
        const achieved = this.loadAchieved();
        return {
            achieved: achieved.length,
            total: BUILT_IN_MILESTONES.length,
        };
    }

    protected loadAchieved(): AchievedMilestone[] {
        this.ensureDirectory();
        try {
            if (fs.existsSync(this.milestonesPath)) {
                const raw = fs.readFileSync(this.milestonesPath, 'utf-8');
                return JSON.parse(raw) as AchievedMilestone[];
            }
        } catch (err) {
            console.warn('[MilestoneService] Could not read milestones file:', err);
        }
        return [];
    }

    protected saveAchieved(achieved: AchievedMilestone[]): void {
        this.ensureDirectory();
        try {
            fs.writeFileSync(this.milestonesPath, JSON.stringify(achieved, undefined, 2), 'utf-8');
        } catch (err) {
            console.error('[MilestoneService] Could not save milestones file:', err);
        }
    }

    protected ensureDirectory(): void {
        if (!fs.existsSync(this.teacherDir)) {
            fs.mkdirSync(this.teacherDir, { recursive: true });
        }
    }
}
