import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, PreferenceContribution, RpcConnectionHandler } from '@theia/core';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { ASIBridgeService, ASI_BRIDGE_SERVICE_PATH } from '../common/asi-bridge-protocol';
import { ASIBridgeServiceImpl } from './asi-bridge-service';
import { ProgressTrackingService, PROGRESS_SERVICE_PATH } from '../common/progress-protocol';
import { ProgressTrackingServiceImpl } from './progress-service';
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
});

export default new ContainerModule(bind => {
    bind(PreferenceContribution).toConstantValue({ schema: TeacherPreferencesSchema });
    bind(ConnectionContainerModule).toConstantValue(teacherConnectionModule);
});
