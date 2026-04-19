import '../../src/browser/style/teacher.css';
import '../../src/browser/style/teacher-identity.css';

import { ContainerModule } from '@theia/core/shared/inversify';
import { ChatAgent } from '@theia/ai-chat/lib/common';
import { Agent, AIVariableContribution } from '@theia/ai-core/lib/common';
import { CommandContribution, PreferenceContribution } from '@theia/core';
import {
    KeybindingContribution,
    RemoteConnectionProvider, ServiceConnectionProvider,
    WidgetFactory, FrontendApplicationContribution, bindViewContribution
} from '@theia/core/lib/browser';
import { TutorAgent } from './agents/tutor-agent';
import { ExplainAgent } from './agents/explain-agent';
import { TeachingReviewAgent } from './agents/review-agent';
import { ASIBridgeService, ASI_BRIDGE_SERVICE_PATH } from '../common/asi-bridge-protocol';
import { ProgressTrackingService, PROGRESS_SERVICE_PATH } from '../common/progress-protocol';
import { TeacherService, TEACHER_SERVICE_PATH } from '../common/teacher-protocol';
import { TeacherPreferencesSchema } from '../common/teacher-preferences';
import { TeacherWelcomeWidget } from './widgets/teacher-welcome-widget';
import { TeacherWelcomeContribution } from './widgets/teacher-welcome-contribution';
import { ProgressDashboardWidget } from './widgets/progress-dashboard-widget';
import { CurriculumBrowserWidget } from './widgets/curriculum-browser-widget';
import { SkillBrowserWidget } from './widgets/skill-browser-widget';
import { LearningAnalyticsWidget } from './widgets/learning-analytics-widget';
import { AIHistorySearchWidget } from './widgets/ai-history-search-widget';
import { LearningPathWidget } from './widgets/learning-path-widget';
import { CanvasWidget } from './widgets/canvas-widget';
import { CanvasContribution } from './widgets/canvas-contribution';
import { CanvasService } from './canvas-service';
import { LessonCommandContribution } from './commands/lesson-commands';
import { VoiceInputContribution } from './commands/voice-input-command';
import { WorkspacePresetContribution } from './commands/workspace-preset-command';
import { KnowledgeSurvivorshipContribution } from './commands/export-snapshot-command';
import { LessonContextVariableContribution } from './lesson-context-variable';

export default new ContainerModule(bind => {
    // Tutor Agent
    bind(TutorAgent).toSelf().inSingletonScope();
    bind(Agent).toService(TutorAgent);
    bind(ChatAgent).toService(TutorAgent);

    // Explain Agent
    bind(ExplainAgent).toSelf().inSingletonScope();
    bind(Agent).toService(ExplainAgent);
    bind(ChatAgent).toService(ExplainAgent);

    // Teaching Review Agent
    bind(TeachingReviewAgent).toSelf().inSingletonScope();
    bind(Agent).toService(TeachingReviewAgent);
    bind(ChatAgent).toService(TeachingReviewAgent);

    // ASI Bridge (frontend proxy to backend service)
    bind(ASIBridgeService).toDynamicValue(ctx => {
        const provider = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
        return provider.createProxy<ASIBridgeService>(ASI_BRIDGE_SERVICE_PATH);
    }).inSingletonScope();

    // Progress Tracking (frontend proxy to backend service)
    bind(ProgressTrackingService).toDynamicValue(ctx => {
        const provider = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
        return provider.createProxy<ProgressTrackingService>(PROGRESS_SERVICE_PATH);
    }).inSingletonScope();

    // Teacher Service (frontend proxy to backend service)
    bind(TeacherService).toDynamicValue(ctx => {
        const provider = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
        return provider.createProxy<TeacherService>(TEACHER_SERVICE_PATH);
    }).inSingletonScope();

    // Preferences
    bind(PreferenceContribution).toConstantValue({ schema: TeacherPreferencesSchema });

    // Welcome Widget
    bind(TeacherWelcomeWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: TeacherWelcomeWidget.ID,
        createWidget: () => context.container.get<TeacherWelcomeWidget>(TeacherWelcomeWidget),
    })).inSingletonScope();
    bindViewContribution(bind, TeacherWelcomeContribution);
    bind(FrontendApplicationContribution).toService(TeacherWelcomeContribution);

    // Progress Dashboard Widget
    bind(ProgressDashboardWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: ProgressDashboardWidget.ID,
        createWidget: () => context.container.get<ProgressDashboardWidget>(ProgressDashboardWidget),
    })).inSingletonScope();

    // Curriculum Browser Widget
    bind(CurriculumBrowserWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: CurriculumBrowserWidget.ID,
        createWidget: () => context.container.get<CurriculumBrowserWidget>(CurriculumBrowserWidget),
    })).inSingletonScope();

    // Skill Browser Widget
    bind(SkillBrowserWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: SkillBrowserWidget.ID,
        createWidget: () => context.container.get<SkillBrowserWidget>(SkillBrowserWidget),
    })).inSingletonScope();

    // Learning Analytics Widget
    bind(LearningAnalyticsWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: LearningAnalyticsWidget.ID,
        createWidget: () => context.container.get<LearningAnalyticsWidget>(LearningAnalyticsWidget),
    })).inSingletonScope();

    // AI History Search Widget
    bind(AIHistorySearchWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: AIHistorySearchWidget.ID,
        createWidget: () => context.container.get<AIHistorySearchWidget>(AIHistorySearchWidget),
    })).inSingletonScope();

    // Learning Path Widget
    bind(LearningPathWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: LearningPathWidget.ID,
        createWidget: () => context.container.get<LearningPathWidget>(LearningPathWidget),
    })).inSingletonScope();

    // Canvas — service + widget + view contribution (Cursor-inspired)
    bind(CanvasService).toSelf().inSingletonScope();
    bind(CanvasWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: CanvasWidget.ID,
        createWidget: () => context.container.get<CanvasWidget>(CanvasWidget),
    })).inSingletonScope();
    bindViewContribution(bind, CanvasContribution);

    // Lesson Commands (Start Lesson, Check My Work, Get Hint, Submit for Review)
    bind(LessonCommandContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(LessonCommandContribution);
    bind(KeybindingContribution).toService(LessonCommandContribution);

    // Voice Input Command (Ctrl+Alt+M — Cursor-inspired)
    bind(VoiceInputContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VoiceInputContribution);
    bind(KeybindingContribution).toService(VoiceInputContribution);

    // Workspace Preset Command (Ctrl+Alt+T — opens the learning workspace)
    bind(WorkspacePresetContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(WorkspacePresetContribution);
    bind(KeybindingContribution).toService(WorkspacePresetContribution);

    // Knowledge Survivorship Commands (Export Snapshot, Anomaly Scan)
    bind(KnowledgeSurvivorshipContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(KnowledgeSurvivorshipContribution);

    // Lesson Context Variable (injects lesson objectives into AI agent prompts)
    bind(LessonContextVariableContribution).toSelf().inSingletonScope();
    bind(AIVariableContribution).toService(LessonContextVariableContribution);
});
