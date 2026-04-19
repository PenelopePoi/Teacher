import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, RpcConnectionHandler } from '@theia/core';
import { SkillEngineService, SKILL_ENGINE_PATH } from '../../common/skill-engine-protocol';
import { SkillParser } from './skill-parser';
import { SkillRegistry } from './skill-registry';
import { SkillExecutor } from './skill-executor';
import { WorkflowRunner } from './workflow-runner';
import { AutoTriggerService } from './auto-trigger-service';
import { SkillEngineServiceImpl } from './skill-engine-service-impl';

/**
 * Backend container module for the Skill Runtime Engine.
 * Binds the parser, registry, executor, workflow runner, auto-trigger service,
 * and the facade SkillEngineService — then exposes the service over RPC.
 */
export const skillEngineBackendModule = new ContainerModule(bind => {
    // Core components
    bind(SkillParser).toSelf().inSingletonScope();
    bind(SkillRegistry).toSelf().inSingletonScope();
    bind(SkillExecutor).toSelf().inSingletonScope();
    bind(WorkflowRunner).toSelf().inSingletonScope();
    bind(AutoTriggerService).toSelf().inSingletonScope();

    // Facade service
    bind(SkillEngineServiceImpl).toSelf().inSingletonScope();
    bind(SkillEngineService).toService(SkillEngineServiceImpl);

    // RPC connection handler
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(SKILL_ENGINE_PATH, () => ctx.container.get(SkillEngineService))
    ).inSingletonScope();
});
