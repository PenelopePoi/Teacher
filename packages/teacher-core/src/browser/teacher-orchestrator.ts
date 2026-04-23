/**
 * Teacher Orchestrator — the central nervous system wiring all subsystems together.
 *
 * Connects:
 *   Friction detection  →  Agent auto-routing (suggest the right agent)
 *   Agent responses     →  Timeline clips + Pulse state + Teachable moment detection
 *   Lesson events       →  Gamification XP + Concept tracking + Auto-triggers
 *   Checkpoint events   →  Timeline annotation
 *   Session lifecycle   →  Friction monitoring + Streak tracking
 *
 * This is a FrontendApplicationContribution that initializes after all services
 * are ready, wiring event listeners between them.
 */

import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { MessageService } from '@theia/core';
import { PulseService } from './pulse/pulse-service';
import { TimelineService, ClipCategory } from './ghost-timeline/timeline-service';
import { CheckpointService } from './checkpoint/checkpoint-service';
import { StudentFrictionService } from './friction/student-friction-service';
import { TeachableMomentService } from './teachable-moments/teachable-moment-service';
import { TeachableMomentDetector } from './teachable-moments/teachable-moment-detector';
import { AgentHandoffService } from './agents/agent-handoff-service';
import { GamificationService } from '../common/gamification-protocol';
import { TeacherService } from '../common/teacher-protocol';
import { SkillEngineService } from '../common/skill-engine-protocol';
import { ProgressTrackingService } from '../common/progress-protocol';
import { FrictionType } from '../common/friction-protocol';
import { ModelRouterService } from '../common/model-router-protocol';
import { BinaryImageGuard } from './guards/binary-image-guard';

/** Maps friction types to the best agent to handle them. */
const FRICTION_TO_AGENT: Record<string, string> = {
    [FrictionType.UndoRedoCycle]: 'teacher-tutor',
    [FrictionType.ErrorPause]: 'teacher-debugger',
    [FrictionType.RepeatedTestFailure]: 'teacher-debugger',
    [FrictionType.ExcessiveDeletions]: 'teacher-tutor',
    [FrictionType.HelpSeeking]: 'teacher-tutor',
    [FrictionType.AssessmentRetries]: 'teacher-review',
    [FrictionType.SessionAbandonment]: 'teacher-motivator',
    [FrictionType.ConceptConfusion]: 'teacher-explain',
};

/** Maps agent IDs to timeline clip categories. */
const AGENT_TO_CLIP_CATEGORY: Record<string, ClipCategory> = {
    'teacher-tutor': 'explanation',
    'teacher-explain': 'explanation',
    'teacher-review': 'review',
    'teacher-debugger': 'code',
    'teacher-growth-tracker': 'assessment',
    'teacher-motivator': 'explanation',
    'teacher-project-builder': 'code',
    'teacher-strategic-planner': 'explanation',
    'teacher-thinking-debugger': 'explanation',
};

/** XP awards per action type. */
const XP_AWARDS = {
    lessonStart: 10,
    lessonComplete: 50,
    conceptLearned: 15,
    checkpointCreated: 5,
    frictionResolved: 20,
    agentInteraction: 5,
    perfectScore: 100,
};

@injectable()
export class TeacherOrchestrator implements FrontendApplicationContribution {

    @inject(PulseService)
    protected readonly pulse: PulseService;

    @inject(TimelineService)
    protected readonly timeline: TimelineService;

    @inject(CheckpointService)
    protected readonly checkpoints: CheckpointService;

    @inject(StudentFrictionService)
    protected readonly friction: StudentFrictionService;

    @inject(TeachableMomentService)
    protected readonly teachable: TeachableMomentService;

    @inject(TeachableMomentDetector)
    protected readonly detector: TeachableMomentDetector;

    @inject(AgentHandoffService)
    protected readonly handoff: AgentHandoffService;

    @inject(GamificationService)
    protected readonly gamification: GamificationService;

    @inject(TeacherService)
    protected readonly teacher: TeacherService;

    @inject(SkillEngineService)
    protected readonly skillEngine: SkillEngineService;

    @inject(ProgressTrackingService)
    protected readonly progress: ProgressTrackingService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(ModelRouterService)
    protected readonly modelRouter: ModelRouterService;

    @inject(BinaryImageGuard)
    protected readonly binaryGuard: BinaryImageGuard;

    protected sessionStartTime: number = Date.now();

    @postConstruct()
    protected init(): void {
        // Defer wiring to onStart so all services are resolved
    }

    onStart(): void {
        this.wireFrictionToAgentRouting();
        this.wireAgentHandoffListeners();
        this.wireCheckpointEvents();
        this.wireSessionLifecycle();
        this.wireTeachableMoments();
        console.info('[TeacherOrchestrator] All subsystem wiring complete.');
    }

    // ── 1. Friction → Agent Auto-Routing ──────────────────────────────

    protected wireFrictionToAgentRouting(): void {
        this.friction.onDidDetectFriction(event => {
            const targetAgent = FRICTION_TO_AGENT[event.type];
            if (!targetAgent) {
                return;
            }

            // Update pulse to indicate the system noticed
            this.pulse.set('suggesting', { label: event.suggestedIntervention?.substring(0, 40) });

            // Log to timeline
            this.timeline.addClip({
                agentId: 'teacher-orchestrator',
                agentName: 'Orchestrator',
                action: `Friction detected: ${event.type} → routing to ${targetAgent}`,
                category: 'assessment',
            });

            // Initiate handoff to the appropriate agent
            this.handoff.initiateHandoff({
                fromAgent: 'teacher-orchestrator',
                toAgent: targetAgent,
                context: {
                    frictionType: event.type,
                    severity: event.severity,
                    frictionContext: event.context,
                    suggestedIntervention: event.suggestedIntervention,
                },
                reason: event.suggestedIntervention || `Student friction: ${event.type}`,
            });

            // Non-interrupting notification (the student sees it but isn't blocked)
            if (event.severity === 'high') {
                this.messageService.info(
                    event.suggestedIntervention || 'The Tutor is here if you need help.',
                    { timeout: 8000 }
                );
            }

            // Reset pulse after 3 seconds
            setTimeout(() => {
                if (this.pulse.state === 'suggesting') {
                    this.pulse.reset();
                }
            }, 3000);
        });
    }

    // ── 2. Agent Handoff Listeners ────────────────────────────────────

    protected wireAgentHandoffListeners(): void {
        const agentIds = [
            'teacher-tutor', 'teacher-explain', 'teacher-review',
            'teacher-debugger', 'teacher-growth-tracker', 'teacher-motivator',
            'teacher-project-builder', 'teacher-strategic-planner', 'teacher-thinking-debugger',
        ];

        for (const agentId of agentIds) {
            // When an agent receives a handoff, log it and update pulse
            this.handoff.onHandoff(agentId, handoff => {
                console.info(`[Orchestrator] Handoff: ${handoff.fromAgent} → ${handoff.toAgent}: ${handoff.reason}`);

                this.pulse.set('thinking', { label: `${this.agentDisplayName(handoff.toAgent)} thinking...` });

                this.timeline.addClip({
                    agentId: handoff.toAgent,
                    agentName: this.agentDisplayName(handoff.toAgent),
                    action: `Handoff from ${this.agentDisplayName(handoff.fromAgent)}: ${handoff.reason}`,
                    category: AGENT_TO_CLIP_CATEGORY[handoff.toAgent] || 'explanation',
                });

                // Award XP for agent interaction
                this.gamification.addXP('agent-interaction', XP_AWARDS.agentInteraction).catch(() => { /* RPC may fail */ });
            });

            // When an agent sends a message, detect teachable moments + update timeline + record for training
            this.handoff.onMessage(agentId, message => {
                if (message.type === 'response' && typeof message.payload === 'string') {
                    this.detectConceptsInResponse(message.payload);

                    this.timeline.addClip({
                        agentId: message.from,
                        agentName: this.agentDisplayName(message.from),
                        action: `Response (${message.payload.length} chars)`,
                        category: AGENT_TO_CLIP_CATEGORY[message.from] || 'explanation',
                    });

                    this.pulse.flashSuggestion(2000, this.agentDisplayName(message.from));

                    // Record interaction for training data collection
                    const userMsg = typeof message.payload === 'string' ? message.payload : '';
                    this.modelRouter.recordInteraction({
                        agentId: message.from,
                        model: 'ollama/qwen2.5:7b',
                        category: AGENT_TO_CLIP_CATEGORY[message.from] || 'explanation',
                        system: `Agent: ${this.agentDisplayName(message.from)}`,
                        user: userMsg.substring(0, 500),
                        assistant: message.payload,
                    }).catch(() => { /* RPC may fail */ });
                }
            });
        }
    }

    // ── 3. Checkpoint Events → XP + Timeline ──────────────────────────

    protected wireCheckpointEvents(): void {
        this.checkpoints.onDidCreateCheckpoint(cp => {
            if (cp.kind === 'manual') {
                this.gamification.addXP('checkpoint-created', XP_AWARDS.checkpointCreated).catch(() => { /* ignore */ });
            }
        });

        this.checkpoints.onDidRewind(cp => {
            this.pulse.set('suggesting', { label: `Rewound to: ${cp.label}` });
            this.timeline.addClip({
                agentId: 'teacher-orchestrator',
                agentName: 'Checkpoint',
                action: `Rewound to "${cp.label}"`,
                category: 'code',
                undoable: false,
            });
            setTimeout(() => this.pulse.reset(), 2000);
        });
    }

    // ── 4. Session Lifecycle ──────────────────────────────────────────

    protected wireSessionLifecycle(): void {
        this.sessionStartTime = Date.now();
        this.friction.startSession();
        this.pulse.set('idle');

        // Attempt auto-trigger for session-start skills
        this.fireAutoTrigger('session-start');

        // Session-long check every 30 minutes
        setInterval(() => {
            const minutes = (Date.now() - this.sessionStartTime) / 60_000;
            if (minutes > 30 && minutes % 30 < 1) {
                this.fireAutoTrigger('session-long');
            }
        }, 60_000);
    }

    // ── 5. Teachable Moment Lifecycle ───────────────────────────────────

    protected wireTeachableMoments(): void {
        // Track previous dismissed count to detect new dismissals
        let previousDismissedCount = this.teachable.getDismissedCount();

        this.teachable.onDidChange(() => {
            const currentCount = this.teachable.getDismissedCount();
            if (currentCount > previousDismissedCount) {
                // New concept(s) dismissed — award XP
                const newDismissals = currentCount - previousDismissedCount;
                for (let i = 0; i < newDismissals; i++) {
                    this.gamification.addXP('concept-learned', XP_AWARDS.conceptLearned).catch(() => { /* ignore */ });
                }
            }
            previousDismissedCount = currentCount;
        });
    }

    // ── 6. Teachable Moment Detection in Responses ────────────────────

    protected detectConceptsInResponse(text: string): void {
        try {
            const detected = this.detector.detect(text);
            for (const match of detected) {
                const id = match.concept.id;
                if (!this.teachable.isDismissed(id)) {
                    this.teachable.recordEncounter(id);
                }
            }

            if (detected.length > 0) {
                this.fireAutoTrigger('concept-new');
            }
        } catch {
            // detector not available
        }
    }

    // ── 7. Auto-Trigger Dispatch ──────────────────────────────────────

    protected async fireAutoTrigger(event: string): Promise<void> {
        try {
            const triggers = await this.skillEngine.getAutoTriggers();
            const skills = triggers[event];
            if (!skills || skills.length === 0) {
                return;
            }
            for (const skillName of skills) {
                console.info(`[Orchestrator] Auto-trigger: ${event} → ${skillName}`);
                // Fire and forget — skill execution is async
                this.skillEngine.executeSkill(skillName, JSON.stringify({ trigger: event, timestamp: Date.now() })).catch(err => {
                    console.warn(`[Orchestrator] Skill ${skillName} failed:`, err);
                });
            }
        } catch {
            // skill engine unavailable (Ollama not running, etc.)
        }
    }

    // ── Public API for lesson events (called from lesson commands) ─────

    /**
     * Called when a lesson starts. Wires up XP, progress, and auto-triggers.
     */
    async onLessonStart(lessonId: string): Promise<void> {
        this.pulse.set('thinking', { label: 'Starting lesson...' });
        await this.gamification.addXP('lesson-start', XP_AWARDS.lessonStart).catch(() => { /* ignore */ });
        await this.progress.recordLessonStart(lessonId).catch(() => { /* ignore */ });

        this.timeline.addClip({
            agentId: 'teacher-orchestrator',
            agentName: 'Teacher',
            action: `Lesson started: ${lessonId}`,
            category: 'assessment',
        });

        this.pulse.set('idle', { label: 'Ready' });
    }

    /**
     * Called when a lesson assessment completes.
     */
    async onLessonComplete(lessonId: string, score: number): Promise<void> {
        await this.progress.recordLessonCompletion(lessonId, score).catch(() => { /* ignore */ });
        await this.gamification.addXP('lesson-complete', XP_AWARDS.lessonComplete).catch(() => { /* ignore */ });

        if (score === 100) {
            await this.gamification.addXP('perfect-score', XP_AWARDS.perfectScore).catch(() => { /* ignore */ });
            await this.gamification.unlockAchievement('perfect-score').catch(() => { /* ignore */ });
        }

        // Check milestone
        const summary = await this.progress.getSummary().catch(() => undefined);
        if (summary) {
            const completed = summary.completedLessons;
            if (completed === 1) {
                await this.gamification.unlockAchievement('lesson-complete').catch(() => { /* ignore */ });
            }
            this.fireAutoTrigger('milestone-reached');
        }

        this.timeline.addClip({
            agentId: 'teacher-orchestrator',
            agentName: 'Assessment',
            action: `Lesson ${lessonId}: ${score}% ${score >= 70 ? '✓' : '✗'}`,
            category: 'assessment',
        });

        this.pulse.flashSuggestion(3000, score >= 70 ? 'Lesson passed!' : 'Keep going!');
    }

    /**
     * Called when a concept is learned/dismissed in teachable moments.
     */
    async onConceptLearned(conceptId: string): Promise<void> {
        await this.gamification.addXP('concept-learned', XP_AWARDS.conceptLearned).catch(() => { /* ignore */ });
        await this.teacher.recordConceptMastery(conceptId, 0.6).catch(() => { /* ignore */ });
        this.fireAutoTrigger('concept-new');
    }

    /**
     * Called when a friction event is resolved by the student.
     */
    async onFrictionResolved(frictionId: string): Promise<void> {
        this.friction.resolveFriction(frictionId);
        await this.gamification.addXP('friction-resolved', XP_AWARDS.frictionResolved).catch(() => { /* ignore */ });
    }

    // ── 8. Binary Image Guard ──────────────────────────────────────────

    /**
     * Check if user input contains raw binary/base64 image data.
     * Call this before sending input to an agent.
     * Returns the block message if blocked, or undefined if safe to proceed.
     */
    guardInput(input: string, agentId?: string): string | undefined {
        const result = this.binaryGuard.check(input, agentId);
        if (result.blocked) {
            this.messageService.info(result.blockMessage || 'Binary data detected and filtered.', { timeout: 10000 });
            this.timeline.addClip({
                agentId: 'teacher-orchestrator',
                agentName: 'Guard',
                action: `Blocked binary data (${result.cleanedInput.length} chars stripped)`,
                category: 'assessment',
            });
            return result.blockMessage;
        }
        if (result.metadata?.teachingOpportunity) {
            // It's intentional — inject teaching context
            console.info(`[Guard] Binary data allowed as teaching opportunity: ${result.metadata.detectedType}`);
        }
        return undefined;
    }

    // ── Helpers ───────────────────────────────────────────────────────

    protected agentDisplayName(id: string): string {
        const names: Record<string, string> = {
            'teacher-tutor': 'Tutor',
            'teacher-explain': 'Explain',
            'teacher-review': 'Review',
            'teacher-debugger': 'Debugger',
            'teacher-growth-tracker': 'Growth',
            'teacher-motivator': 'Coach',
            'teacher-project-builder': 'Project',
            'teacher-strategic-planner': 'Planner',
            'teacher-thinking-debugger': 'Thinking',
            'teacher-orchestrator': 'Teacher',
        };
        return names[id] || id;
    }
}
