import '../../src/browser/style/teacher.css';

import { ContainerModule } from '@theia/core/shared/inversify';
import { ChatAgent } from '@theia/ai-chat/lib/common';
import { Agent } from '@theia/ai-core/lib/common';
import { PreferenceContribution } from '@theia/core';
import {
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
});
