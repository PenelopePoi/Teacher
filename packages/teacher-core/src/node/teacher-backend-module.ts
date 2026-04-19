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
});
