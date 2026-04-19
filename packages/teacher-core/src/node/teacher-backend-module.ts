import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, PreferenceContribution, RpcConnectionHandler } from '@theia/core';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { ASIBridgeService, ASI_BRIDGE_SERVICE_PATH } from '../common/asi-bridge-protocol';
import { ASIBridgeServiceImpl } from './asi-bridge-service';
import { ProgressTrackingService, PROGRESS_SERVICE_PATH } from '../common/progress-protocol';
import { ProgressTrackingServiceImpl } from './progress-service';
import { CurriculumService, CURRICULUM_SERVICE_PATH, CurriculumServiceImpl } from './curriculum-service';
import { TemplateService, TEMPLATE_SERVICE_PATH, TemplateServiceImpl } from './template-service';
import { AssessmentService, ASSESSMENT_SERVICE_PATH, AssessmentServiceImpl } from './assessment-service';
import { TeacherPreferencesSchema } from '../common/teacher-preferences';

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
});

export default new ContainerModule(bind => {
    bind(PreferenceContribution).toConstantValue({ schema: TeacherPreferencesSchema });
    bind(ConnectionContainerModule).toConstantValue(teacherConnectionModule);
});
