import { ContainerModule } from '@theia/core/shared/inversify';
import { ChatAgent } from '@theia/ai-chat/lib/common';
import { Agent } from '@theia/ai-core/lib/common';
import { PreferenceContribution } from '@theia/core';
import {
    RemoteConnectionProvider, ServiceConnectionProvider
} from '@theia/core/lib/browser';
import { TutorAgent } from './agents/tutor-agent';
import { ExplainAgent } from './agents/explain-agent';
import { TeachingReviewAgent } from './agents/review-agent';
import { ASIBridgeService, ASI_BRIDGE_SERVICE_PATH } from '../common/asi-bridge-protocol';
import { ProgressTrackingService, PROGRESS_SERVICE_PATH } from '../common/progress-protocol';
import { TeacherPreferencesSchema } from '../common/teacher-preferences';

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

    // Preferences
    bind(PreferenceContribution).toConstantValue({ schema: TeacherPreferencesSchema });
});
