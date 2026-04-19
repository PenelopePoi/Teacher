/**
 * User Profile Protocol — persistent identity and learning state.
 *
 * This is the student's substrate: portable, owned, and cryptographically theirs.
 * It travels across sessions, devices, and — eventually — across tools.
 *
 * From the 2126 spec: "Every user has a personal data substrate: cryptographically-secured,
 * user-controlled. Teacher writes to it. Teacher does not own it."
 */

export const USER_PROFILE_SERVICE_PATH = '/services/user-profile';

export const UserProfileService = Symbol('UserProfileService');

export interface UserProfileService {
    /** Get or create the current user's profile. */
    getProfile(): Promise<UserProfile>;
    /** Update profile fields. Merges with existing data. */
    updateProfile(updates: Partial<UserProfileMutable>): Promise<UserProfile>;
    /** Record a learning session. */
    recordSession(session: LearningSession): Promise<void>;
    /** Get recent learning sessions. */
    getSessions(limit?: number): Promise<LearningSession[]>;
    /** Add an achievement. */
    awardAchievement(achievement: Achievement): Promise<void>;
    /** Get all achievements. */
    getAchievements(): Promise<Achievement[]>;
    /** Record a daily check-in (updates streak). */
    recordDailyActivity(): Promise<StreakInfo>;
    /** Get current streak info. */
    getStreakInfo(): Promise<StreakInfo>;
    /** Export the full profile as portable JSON. */
    exportProfile(): Promise<string>;
}

/** The full user profile — identity + learning state + history. */
export interface UserProfile {
    /** Unique ID (UUID, generated on first use). */
    readonly id: string;
    /** Display name (set by user). */
    displayName: string;
    /** When this profile was created. ISO 8601. */
    readonly createdAt: string;
    /** Last active timestamp. ISO 8601. */
    lastActiveAt: string;

    // --- Learning State ---
    /** Current skill level, auto-adjusted based on performance. */
    level: UserLevel;
    /** Preferred learning style. */
    preferredStyle: LearningStyle;
    /** Student-defined goals. */
    goals: UserGoal[];
    /** Interests and domains the user is focused on. */
    interests: string[];

    // --- Statistics ---
    /** Total sessions recorded. */
    totalSessions: number;
    /** Total time learning, in minutes. */
    totalMinutes: number;
    /** Total lessons completed. */
    lessonsCompleted: number;
    /** Total concepts mastered (dismissed in Teachable Moments). */
    conceptsMastered: number;
    /** Total assessments passed. */
    assessmentsPassed: number;

    // --- Streak ---
    /** Current consecutive-days streak. */
    currentStreak: number;
    /** Longest streak ever achieved. */
    longestStreak: number;
    /** Dates of activity (ISO date strings, YYYY-MM-DD). Last 90 days. */
    activityDates: string[];

    // --- Achievements ---
    /** Earned achievements. */
    achievements: Achievement[];

    // --- Preferences ---
    /** AI interaction preferences. */
    aiPreferences: AIPreferences;
}

/** Fields the user can directly edit. */
export type UserProfileMutable = Pick<UserProfile,
    'displayName' | 'preferredStyle' | 'goals' | 'interests' | 'aiPreferences'
>;

export type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed';

export interface UserGoal {
    /** Goal ID. */
    id: string;
    /** What the user wants to achieve. */
    description: string;
    /** When it was set. ISO 8601. */
    createdAt: string;
    /** Whether it's been completed. */
    completed: boolean;
    /** When it was completed, if ever. ISO 8601. */
    completedAt?: string;
    /** Target date, if any. ISO 8601. */
    targetDate?: string;
}

export interface LearningSession {
    /** Session ID. */
    id: string;
    /** When the session started. ISO 8601. */
    startedAt: string;
    /** When it ended. ISO 8601. */
    endedAt: string;
    /** Duration in minutes. */
    durationMinutes: number;
    /** What the user worked on. */
    activity: SessionActivity;
    /** Lessons touched this session. */
    lessonIds: string[];
    /** Concepts encountered this session. */
    conceptsEncountered: string[];
    /** Agent interactions this session. */
    agentInteractions: number;
    /** Checkpoints created this session. */
    checkpointsCreated: number;
    /** Assessment scores this session. */
    assessmentScores: Array<{ lessonId: string; score: number }>;
}

export type SessionActivity =
    | 'lesson'
    | 'free-coding'
    | 'review'
    | 'exploration'
    | 'project'
    | 'assessment';

export interface Achievement {
    /** Achievement ID. */
    id: string;
    /** Display name. */
    name: string;
    /** Description of what was achieved. */
    description: string;
    /** Icon (codicon class). */
    icon: string;
    /** When it was earned. ISO 8601. */
    earnedAt: string;
    /** Rarity: how many students have earned this. */
    rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface StreakInfo {
    /** Current consecutive days. */
    current: number;
    /** Longest ever. */
    longest: number;
    /** Whether today has been recorded. */
    todayRecorded: boolean;
    /** Last 7 days: true = active, false = missed. */
    weekView: boolean[];
}

export interface AIPreferences {
    /** How much the AI should explain. */
    verbosity: 'concise' | 'normal' | 'detailed';
    /** Whether to use Socratic questioning. */
    socraticMode: boolean;
    /** Preferred permission mode. */
    defaultMode: 'review' | 'assist' | 'autonomous' | 'observer';
    /** Whether to show Teachable Moments automatically. */
    showTeachableMoments: boolean;
    /** Whether to show Spiral Review reminders. */
    showSpiralReview: boolean;
}

/** Built-in achievements that Teacher awards automatically. */
export const BUILT_IN_ACHIEVEMENTS: Omit<Achievement, 'earnedAt'>[] = [
    { id: 'first-lesson', name: 'First Steps', description: 'Completed your first lesson', icon: 'codicon-rocket', rarity: 'common' },
    { id: 'first-ask', name: 'Curious Mind', description: 'Asked the Tutor your first question', icon: 'codicon-comment-discussion', rarity: 'common' },
    { id: 'streak-3', name: 'Three-Day Streak', description: 'Learned for 3 consecutive days', icon: 'codicon-flame', rarity: 'common' },
    { id: 'streak-7', name: 'Week Warrior', description: 'Learned for 7 consecutive days', icon: 'codicon-flame', rarity: 'uncommon' },
    { id: 'streak-30', name: 'Monthly Dedication', description: 'Learned for 30 consecutive days', icon: 'codicon-flame', rarity: 'rare' },
    { id: 'concepts-10', name: 'Concept Collector', description: 'Mastered 10 concepts', icon: 'codicon-lightbulb', rarity: 'common' },
    { id: 'concepts-25', name: 'Knowledge Builder', description: 'Mastered 25 concepts', icon: 'codicon-lightbulb', rarity: 'uncommon' },
    { id: 'concepts-50', name: 'Walking Encyclopedia', description: 'Mastered 50 concepts', icon: 'codicon-lightbulb', rarity: 'rare' },
    { id: 'perfect-score', name: 'Perfect Score', description: 'Scored 100% on an assessment', icon: 'codicon-star-full', rarity: 'uncommon' },
    { id: 'course-complete', name: 'Course Graduate', description: 'Completed an entire course', icon: 'codicon-mortar-board', rarity: 'uncommon' },
    { id: 'night-owl', name: 'Night Owl', description: 'Coded past midnight', icon: 'codicon-eye', rarity: 'common' },
    { id: 'early-bird', name: 'Early Bird', description: 'Started a session before 7am', icon: 'codicon-sun', rarity: 'uncommon' },
    { id: 'bug-squasher', name: 'Bug Squasher', description: 'Fixed a failing test on the first try', icon: 'codicon-bug', rarity: 'uncommon' },
    { id: 'code-reviewer', name: 'Self-Reviewer', description: 'Used Teaching Review on your own code', icon: 'codicon-checklist', rarity: 'common' },
    { id: 'checkpoint-master', name: 'Checkpoint Master', description: 'Created 10 manual checkpoints', icon: 'codicon-save', rarity: 'uncommon' },
    { id: 'audio-pioneer', name: 'Audio Pioneer', description: 'Mastered your first Audio concept', icon: 'codicon-unmute', rarity: 'uncommon' },
    { id: 'full-stack', name: 'Full Stack', description: 'Completed lessons in Python, Web, and Git', icon: 'codicon-layers', rarity: 'rare' },
    { id: 'teacher-pet', name: 'Teacher\'s Pet', description: 'Had 100+ agent interactions in one session', icon: 'codicon-heart', rarity: 'rare' },
];
