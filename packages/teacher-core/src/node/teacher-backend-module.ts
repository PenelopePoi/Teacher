import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, PreferenceContribution, RpcConnectionHandler } from '@theia/core';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import * as fs from 'fs';
import * as path from 'path';
import { ASIBridgeService, ASI_BRIDGE_SERVICE_PATH } from '../common/asi-bridge-protocol';
import { ASIBridgeServiceImpl } from './asi-bridge-service';
import { ProgressTrackingService, PROGRESS_SERVICE_PATH } from '../common/progress-protocol';
import { ProgressTrackingServiceImpl } from './progress-service';
import { CurriculumService, CURRICULUM_SERVICE_PATH, CurriculumServiceImpl } from './curriculum-service';
import { TemplateService, TEMPLATE_SERVICE_PATH, TemplateServiceImpl } from './template-service';
import { AssessmentService, ASSESSMENT_SERVICE_PATH, AssessmentServiceImpl } from './assessment-service';
import { TeacherPreferencesSchema } from '../common/teacher-preferences';
import { SkillEngineService, SKILL_ENGINE_PATH } from '../common/skill-engine-protocol';
import { SkillParser } from './skill-engine/skill-parser';
import { SkillRegistry } from './skill-engine/skill-registry';
import { SkillExecutor } from './skill-engine/skill-executor';
import { WorkflowRunner } from './skill-engine/workflow-runner';
import { AutoTriggerService } from './skill-engine/auto-trigger-service';
import { SkillEngineServiceImpl } from './skill-engine/skill-engine-service-impl';
import {
    LearningProfileServiceSymbol,
    LearningProfileService,
    LearningProfileServiceImpl,
    LEARNING_PROFILE_SERVICE_PATH,
} from './learning-profile-service';
import {
    ConceptTrackerSymbol,
    ConceptTracker,
    ConceptTrackerImpl,
    CONCEPT_TRACKER_PATH,
} from './concept-tracker-impl';
import {
    MilestoneServiceSymbol,
    MilestoneService,
    MilestoneServiceImpl,
    MILESTONE_SERVICE_PATH,
} from './milestone-service-impl';
import { SessionLogger } from './session-logger';
import { StreakTracker } from './streak-tracker';
import { AutoReviewService } from './auto-review-service';
import { UserProfileService, USER_PROFILE_SERVICE_PATH } from '../common/user-profile-protocol';
import { UserProfileServiceImpl } from './user-profile-service';
import { TeacherService, TEACHER_SERVICE_PATH } from '../common/teacher-protocol';
import { TeacherServiceImpl } from './teacher-service-impl';
import { GamificationService, GAMIFICATION_PATH } from '../common/gamification-protocol';
import { GamificationServiceImpl } from './gamification-service-impl';
import { IntentService, INTENT_SERVICE_PATH } from '../common/intent-protocol';
import { CelebrationServiceSymbol } from '../common/celebration-protocol';
import { CelebrationServiceImpl, CELEBRATION_SERVICE_PATH } from './celebration-service-impl';
import { RecommendationEngineSymbol, RECOMMENDATION_ENGINE_PATH } from '../common/recommendation-engine-protocol';
import { RecommendationEngineImpl } from './recommendation-engine-impl';
import { TeachingStyleServiceSymbol } from '../common/teaching-style-protocol';
import { TeachingStyleServiceImpl, TEACHING_STYLE_SERVICE_PATH } from './teaching-style-service-impl';
import { OllamaBootstrapService } from './ollama-bootstrap-service';
import { ModelRouter } from './model-router';
import { TrainingDataCollector } from './training-data-collector';
import { ModelRouterService, MODEL_ROUTER_SERVICE_PATH } from '../common/model-router-protocol';
import { ModelRouterServiceImpl } from './model-router-service-impl';
import { IntentServiceImpl } from './intent-service-impl';

const teacherConnectionModule = ConnectionContainerModule.create(({ bind }) => {
    bind(ASIBridgeServiceImpl).toSelf().inSingletonScope();
    bind(ASIBridgeService).toService(ASIBridgeServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(ASI_BRIDGE_SERVICE_PATH, () => ctx.container.get(ASIBridgeService))
    ).inSingletonScope();

    bind(ProgressTrackingServiceImpl).toSelf().inSingletonScope();
    bind(ProgressTrackingService).toService(ProgressTrackingServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(PROGRESS_SERVICE_PATH, () => ctx.container.get(ProgressTrackingService))
    ).inSingletonScope();

    bind(CurriculumServiceImpl).toSelf().inSingletonScope();
    bind(CurriculumService).toService(CurriculumServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(CURRICULUM_SERVICE_PATH, () => ctx.container.get(CurriculumService))
    ).inSingletonScope();

    bind(TemplateServiceImpl).toSelf().inSingletonScope();
    bind(TemplateService).toService(TemplateServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(TEMPLATE_SERVICE_PATH, () => ctx.container.get(TemplateService))
    ).inSingletonScope();

    bind(AssessmentServiceImpl).toSelf().inSingletonScope();
    bind(AssessmentService).toService(AssessmentServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(ASSESSMENT_SERVICE_PATH, () => ctx.container.get(AssessmentService))
    ).inSingletonScope();

    // LearningProfileService — reads/writes ~/.teacher/learning-profile.json
    bind(LearningProfileServiceImpl).toSelf().inSingletonScope();
    bind(LearningProfileServiceSymbol).toService(LearningProfileServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler<LearningProfileService>(LEARNING_PROFILE_SERVICE_PATH, () => {
            const svc = ctx.container.get<LearningProfileService>(LearningProfileServiceSymbol);
            return svc;
        })
    ).inSingletonScope();

    // ConceptTracker — stores concepts in ~/.teacher/concepts.json
    bind(ConceptTrackerImpl).toSelf().inSingletonScope();
    bind(ConceptTrackerSymbol).toService(ConceptTrackerImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler<ConceptTracker>(CONCEPT_TRACKER_PATH, () => {
            const svc = ctx.container.get<ConceptTracker>(ConceptTrackerSymbol);
            return svc;
        })
    ).inSingletonScope();

    // UserProfileService — persistent user identity, achievements, sessions
    bind(UserProfileServiceImpl).toSelf().inSingletonScope();
    bind(UserProfileService).toService(UserProfileServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(USER_PROFILE_SERVICE_PATH, () => ctx.container.get(UserProfileService))
    ).inSingletonScope();

    // MilestoneService — stores milestones in ~/.teacher/milestones.json
    bind(MilestoneServiceImpl).toSelf().inSingletonScope();
    bind(MilestoneServiceSymbol).toService(MilestoneServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler<MilestoneService>(MILESTONE_SERVICE_PATH, () => {
            const svc = ctx.container.get<MilestoneService>(MilestoneServiceSymbol);
            return svc;
        })
    ).inSingletonScope();

    // TeacherService — lesson lifecycle orchestrator
    bind(TeacherServiceImpl).toSelf().inSingletonScope();
    bind(TeacherService).toService(TeacherServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(TEACHER_SERVICE_PATH, () => ctx.container.get(TeacherService))
    ).inSingletonScope();

    // GamificationService — XP, levels, achievements, challenges
    bind(GamificationServiceImpl).toSelf().inSingletonScope();
    bind(GamificationService).toService(GamificationServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(GAMIFICATION_PATH, () => ctx.container.get(GamificationService))
    ).inSingletonScope();

    // IntentService — voice/text/gesture intent capture and persistence
    bind(IntentServiceImpl).toSelf().inSingletonScope();
    bind(IntentService).toService(IntentServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(INTENT_SERVICE_PATH, () => ctx.container.get(IntentService))
    ).inSingletonScope();

    // CelebrationService — milestone celebration events
    bind(CelebrationServiceImpl).toSelf().inSingletonScope();
    bind(CelebrationServiceSymbol).toService(CelebrationServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(CELEBRATION_SERVICE_PATH, () => ctx.container.get(CelebrationServiceSymbol))
    ).inSingletonScope();

    // RecommendationEngine — personalized learning recommendations
    bind(RecommendationEngineImpl).toSelf().inSingletonScope();
    bind(RecommendationEngineSymbol).toService(RecommendationEngineImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(RECOMMENDATION_ENGINE_PATH, () => ctx.container.get(RecommendationEngineSymbol))
    ).inSingletonScope();

    // TeachingStyleService — student teaching preference management
    bind(TeachingStyleServiceImpl).toSelf().inSingletonScope();
    bind(TeachingStyleServiceSymbol).toService(TeachingStyleServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(TEACHING_STYLE_SERVICE_PATH, () => ctx.container.get(TeachingStyleServiceSymbol))
    ).inSingletonScope();
});

/*
 * ~/.teacher/ directory structure:
 *
 * ~/.teacher/
 * ├── learning-profile.json   — Student's learning profile (level, style, goals)
 * ├── concepts.json           — Tracked concepts with seen/mastered timestamps
 * ├── milestones.json         — Achieved milestones with timestamps
 * ├── streak.json             — Daily coding streak data
 * ├── sessions/
 * │   ├── 2026-04-19.jsonl    — Session log for each day (JSON Lines format)
 * │   └── ...
 * └── (future: curriculum/, progress/, etc.)
 *
 * ~/.claude/skills/           — SKILL.md files indexed by the SkillRegistry
 * └── _metrics/metrics.json   — Skill execution metrics
 */

export default new ContainerModule(bind => {
    bind(PreferenceContribution).toConstantValue({ schema: TeacherPreferencesSchema });
    bind(ConnectionContainerModule).toConstantValue(teacherConnectionModule);

    // Startup validation: check that ~/.claude/skills/ exists
    const skillsDir = path.join(process.env.HOME || '~', '.claude', 'skills');
    if (!fs.existsSync(skillsDir)) {
        console.warn(
            `[Teacher] Skills directory not found at ${skillsDir}. ` +
            'Skill-related features will not function until skills are installed. ' +
            'Run: mkdir -p ~/.claude/skills'
        );
    }

    // Skill Runtime Engine — makes 343 SKILL.md files into live IDE citizens
    bind(SkillParser).toSelf().inSingletonScope();
    bind(SkillRegistry).toSelf().inSingletonScope();
    bind(SkillExecutor).toSelf().inSingletonScope();
    bind(WorkflowRunner).toSelf().inSingletonScope();
    bind(AutoTriggerService).toSelf().inSingletonScope();
    bind(SkillEngineServiceImpl).toSelf().inSingletonScope();
    bind(SkillEngineService).toService(SkillEngineServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(SKILL_ENGINE_PATH, () => ctx.container.get(SkillEngineService))
    ).inSingletonScope();

    // Session logging and streak tracking (singletons, no RPC)
    bind(SessionLogger).toSelf().inSingletonScope();
    bind(StreakTracker).toSelf().inSingletonScope();
    bind(AutoReviewService).toSelf().inSingletonScope();

    // Ollama auto-start — ensures Ollama is running + model available
    bind(OllamaBootstrapService).toSelf().inSingletonScope();

    // Model Router — intelligent model selection per prompt category
    bind(ModelRouter).toSelf().inSingletonScope();

    // Training Data Collector — logs interactions for custom model fine-tuning
    bind(TrainingDataCollector).toSelf().inSingletonScope();

    // Model Router RPC Service — exposes routing + training to frontend
    bind(ModelRouterServiceImpl).toSelf().inSingletonScope();
    bind(ModelRouterService).toService(ModelRouterServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(MODEL_ROUTER_SERVICE_PATH, () => ctx.container.get(ModelRouterService))
    ).inSingletonScope();
});
