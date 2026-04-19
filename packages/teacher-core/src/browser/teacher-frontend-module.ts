import '../../src/browser/style/teacher.css';
import '../../src/browser/style/teacher-identity.css';
import '../../src/browser/style/before-after.css';
import '../../src/browser/style/ghost-timeline.css';
import '../../src/browser/style/teachable-moments.css';

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
import { SkillEngineService, SKILL_ENGINE_PATH } from '../common/skill-engine-protocol';
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
import { PulseService } from './pulse/pulse-service';
import { TeacherStatusContribution } from './status/teacher-status-contribution';
import { DragToAskContribution } from './components/drag-to-ask-contribution';
import { GhostTimelineWidget } from './widgets/ghost-timeline-widget';
import { GhostTimelineContribution } from './widgets/ghost-timeline-contribution';
import { PulsePanelWidget } from './widgets/pulse-panel-widget';
import { PulsePanelContribution } from './widgets/pulse-panel-contribution';
import { TeachableMomentsWidget } from './widgets/teachable-moments-widget';
import { TeachableMomentsContribution } from './widgets/teachable-moments-contribution';
import { PlanModeWidget } from './widgets/plan-mode-widget';
import { PlanModeContribution } from './widgets/plan-mode-contribution';
import { RewindPanelWidget } from './widgets/rewind-panel-widget';
import { RewindPanelContribution } from './widgets/rewind-panel-contribution';
import { PermissionModeWidget } from './widgets/permission-mode-widget';
import { PermissionModeContribution } from './widgets/permission-mode-contribution';
import { CanvasReviewWidget } from './widgets/canvas-review-widget';
import { CanvasReviewContribution } from './widgets/canvas-review-contribution';
import { SkillCommandWidget } from './widgets/skill-command-widget';
import { SkillCommandContribution } from './widgets/skill-command-contribution';
import { WorkflowBuilderWidget } from './widgets/workflow-builder-widget';
import { WorkflowBuilderContribution } from './widgets/workflow-builder-contribution';
import { ImprovementDashboardWidget } from './widgets/improvement-dashboard-widget';
import { ImprovementDashboardContribution } from './widgets/improvement-dashboard-contribution';
import { LessonCommandContribution } from './commands/lesson-commands';
import { VoiceInputContribution } from './commands/voice-input-command';
import { WorkspacePresetContribution } from './commands/workspace-preset-command';
import { KnowledgeSurvivorshipContribution } from './commands/export-snapshot-command';
import { LessonContextVariableContribution } from './lesson-context-variable';
import { TimelineService } from './ghost-timeline/timeline-service';
import { ModeCycleContribution } from './commands/mode-cycle-command';
import { BeforeAfterService } from './before-after/before-after-service';
import { BeforeAfterWidget } from './before-after/before-after-widget';
import { BeforeAfterContribution } from './before-after/before-after-contribution';
import { IntentDockWidget } from './intents/intent-dock-widget';
import { PinnedThoughtGutter } from './intents/pinned-thought-gutter';
import { TeachableMomentService } from './teachable-moments/teachable-moment-service';
import { TeachableMomentDetector } from './teachable-moments/teachable-moment-detector';
import { TeachableMomentExplainerWidget } from './teachable-moments/teachable-moment-widget';
import { PedagogyLibraryWidget } from './teachable-moments/pedagogy-library-widget';

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

    // Skill Engine (frontend proxy to backend service)
    bind(SkillEngineService).toDynamicValue(ctx => {
        const provider = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
        return provider.createProxy<SkillEngineService>(SKILL_ENGINE_PATH);
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

    // Pulse — §6 signature primitive (breathing orb service)
    bind(PulseService).toSelf().inSingletonScope();

    // §1 P#5 — Status bar rebuild (hide stock confetti, add Pulse + project + model)
    bind(TeacherStatusContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(TeacherStatusContribution);

    // §2 item #3 — Drag-to-Ask floating orb (always-mounted body overlay)
    bind(DragToAskContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(DragToAskContribution);

    // C7 Ghost Timeline — TimelineService (Ableton-style AI action tracking)
    bind(TimelineService).toSelf().inSingletonScope();

    // C7 Ghost Timeline widget (bottom dock area)
    bind(GhostTimelineWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: GhostTimelineWidget.ID,
        createWidget: () => context.container.get<GhostTimelineWidget>(GhostTimelineWidget),
    })).inSingletonScope();
    bindViewContribution(bind, GhostTimelineContribution);

    // §2 — Pulse Panel widget (ambient AI status strip)
    bind(PulsePanelWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: PulsePanelWidget.ID,
        createWidget: () => context.container.get<PulsePanelWidget>(PulsePanelWidget),
    })).inSingletonScope();
    bindViewContribution(bind, PulsePanelContribution);

    // §2 item #6 — Teachable Moments widget (learned concepts tracker)
    bind(TeachableMomentsWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: TeachableMomentsWidget.ID,
        createWidget: () => context.container.get<TeachableMomentsWidget>(TeachableMomentsWidget),
    })).inSingletonScope();
    bindViewContribution(bind, TeachableMomentsContribution);

    // Plan Mode widget (read-only plan before code executes)
    bind(PlanModeWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: PlanModeWidget.ID,
        createWidget: () => context.container.get<PlanModeWidget>(PlanModeWidget),
    })).inSingletonScope();
    bindViewContribution(bind, PlanModeContribution);

    // Rewind Panel widget (visual checkpoint management)
    bind(RewindPanelWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: RewindPanelWidget.ID,
        createWidget: () => context.container.get<RewindPanelWidget>(RewindPanelWidget),
    })).inSingletonScope();
    bindViewContribution(bind, RewindPanelContribution);

    // C16 Mode Cycle — four-mode permission cycle (Review/Assist/Autonomous/Observer)
    bind(ModeCycleContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(ModeCycleContribution);
    bind(KeybindingContribution).toService(ModeCycleContribution);
    bind(FrontendApplicationContribution).toService(ModeCycleContribution);

    // Permission Mode widget (trust level display — uses ModeCycleContribution)
    bind(PermissionModeWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: PermissionModeWidget.ID,
        createWidget: () => context.container.get<PermissionModeWidget>(PermissionModeWidget),
    })).inSingletonScope();
    bindViewContribution(bind, PermissionModeContribution);

    // Canvas Review widget (before/after visual diff)
    bind(CanvasReviewWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: CanvasReviewWidget.ID,
        createWidget: () => context.container.get<CanvasReviewWidget>(CanvasReviewWidget),
    })).inSingletonScope();
    bindViewContribution(bind, CanvasReviewContribution);

    // Skill Command widget (command-palette skill launcher — left panel)
    bind(SkillCommandWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: SkillCommandWidget.ID,
        createWidget: () => context.container.get<SkillCommandWidget>(SkillCommandWidget),
    })).inSingletonScope();
    bindViewContribution(bind, SkillCommandContribution);

    // Workflow Builder widget (pipeline editor — right panel)
    bind(WorkflowBuilderWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: WorkflowBuilderWidget.ID,
        createWidget: () => context.container.get<WorkflowBuilderWidget>(WorkflowBuilderWidget),
    })).inSingletonScope();
    bindViewContribution(bind, WorkflowBuilderContribution);

    // Improvement Dashboard widget (skill health metrics — main area)
    bind(ImprovementDashboardWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: ImprovementDashboardWidget.ID,
        createWidget: () => context.container.get<ImprovementDashboardWidget>(ImprovementDashboardWidget),
    })).inSingletonScope();
    bindViewContribution(bind, ImprovementDashboardContribution);

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

    // Before/After Canvas (C6) — visual diff review surface for creatives
    bind(BeforeAfterService).toSelf().inSingletonScope();
    bind(BeforeAfterWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: BeforeAfterWidget.ID,
        createWidget: () => context.container.get<BeforeAfterWidget>(BeforeAfterWidget),
    })).inSingletonScope();
    bindViewContribution(bind, BeforeAfterContribution);

    // Intent Dock (A5/A6) — pending intent cards sidebar
    bind(IntentDockWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: IntentDockWidget.ID,
        createWidget: () => context.container.get<IntentDockWidget>(IntentDockWidget),
    })).inSingletonScope();

    // Pinned Thought Gutter — Monaco editor margin decorations
    bind(PinnedThoughtGutter).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(PinnedThoughtGutter);

    // C9 Teachable Moments — the pedagogy primitive that survives 100 years
    bind(TeachableMomentService).toSelf().inSingletonScope();
    bind(TeachableMomentDetector).toSelf().inSingletonScope();

    // C9 Teachable Moment Explainer widget (floating concept cards)
    bind(TeachableMomentExplainerWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: TeachableMomentExplainerWidget.ID,
        createWidget: () => context.container.get<TeachableMomentExplainerWidget>(TeachableMomentExplainerWidget),
    })).inSingletonScope();

    // C9 Pedagogy Library widget (personal curriculum built through working)
    bind(PedagogyLibraryWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: PedagogyLibraryWidget.ID,
        createWidget: () => context.container.get<PedagogyLibraryWidget>(PedagogyLibraryWidget),
    })).inSingletonScope();
});
