import { injectable } from '@theia/core/shared/inversify';
import * as fs from 'fs';
import * as path from 'path';
import { LearningProfile } from '../common/learning-profile';

/**
 * Service path for the LearningProfileService backend.
 */
export const LEARNING_PROFILE_SERVICE_PATH = '/services/learning-profile';

/**
 * Symbol for dependency injection of the LearningProfileService.
 */
export const LearningProfileServiceSymbol = Symbol('LearningProfileService');

/**
 * RPC interface for the LearningProfileService.
 */
export interface LearningProfileService {
    /** Returns the current learning profile, creating a default one if none exists. */
    getProfile(): Promise<LearningProfile>;
    /** Saves a complete learning profile, overwriting the previous one. */
    saveProfile(profile: LearningProfile): Promise<void>;
    /** Merges partial updates into the existing profile. */
    updateProfile(updates: Partial<LearningProfile>): Promise<LearningProfile>;
}

/**
 * Implements LearningProfile storage by reading/writing
 * ~/.teacher/learning-profile.json. Creates the directory if missing.
 */
@injectable()
export class LearningProfileServiceImpl implements LearningProfileService {

    protected readonly teacherDir: string = path.join(
        process.env.HOME || '~', '.teacher'
    );

    protected readonly profilePath: string = path.join(
        this.teacherDir, 'learning-profile.json'
    );

    async getProfile(): Promise<LearningProfile> {
        this.ensureDirectory();
        try {
            if (fs.existsSync(this.profilePath)) {
                const raw = fs.readFileSync(this.profilePath, 'utf-8');
                return JSON.parse(raw) as LearningProfile;
            }
        } catch (err) {
            console.warn('[LearningProfileService] Could not read profile, returning default:', err);
        }
        const defaultProfile = LearningProfile.createDefault();
        await this.saveProfile(defaultProfile);
        return defaultProfile;
    }

    async saveProfile(profile: LearningProfile): Promise<void> {
        this.ensureDirectory();
        try {
            fs.writeFileSync(this.profilePath, JSON.stringify(profile, undefined, 2), 'utf-8');
        } catch (err) {
            console.error('[LearningProfileService] Could not save profile:', err);
        }
    }

    async updateProfile(updates: Partial<LearningProfile>): Promise<LearningProfile> {
        const current = await this.getProfile();
        const merged: LearningProfile = { ...current, ...updates };
        // Merge arrays additively for completedConcepts, weakAreas, goals
        if (updates.completedConcepts) {
            merged.completedConcepts = Array.from(
                new Set([...current.completedConcepts, ...updates.completedConcepts])
            );
        }
        if (updates.weakAreas) {
            merged.weakAreas = Array.from(
                new Set([...current.weakAreas, ...updates.weakAreas])
            );
        }
        if (updates.goals) {
            merged.goals = Array.from(
                new Set([...current.goals, ...updates.goals])
            );
        }
        await this.saveProfile(merged);
        return merged;
    }

    protected ensureDirectory(): void {
        if (!fs.existsSync(this.teacherDir)) {
            fs.mkdirSync(this.teacherDir, { recursive: true });
        }
    }
}
