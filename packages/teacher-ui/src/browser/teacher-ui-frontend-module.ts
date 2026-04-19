import '../../src/browser/style/teacher-shell.css';
import '../../src/browser/style/teacher-identity.css';

import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution, PreferenceContribution } from '@theia/core';
import {
    FrontendApplicationContribution,
    KeybindingContribution,
    StatusBar,
    WidgetFactory
} from '@theia/core/lib/browser';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import { SidePanelHandler } from '@theia/core/lib/browser/shell/side-panel-handler';
import { TabBarRendererFactory } from '@theia/core/lib/browser/shell/tab-bars';
import { ContextMenuRenderer } from '@theia/core/lib/browser/context-menu-renderer';
import { TabBarDecoratorService } from '@theia/core/lib/browser/shell/tab-bar-decorator';
import { IconThemeService } from '@theia/core/lib/browser/icon-theme-service';
import { SelectionService } from '@theia/core/lib/common/selection-service';
import { CommandService } from '@theia/core/lib/common/command';
import { CorePreferences } from '@theia/core/lib/common/core-preferences';
import { HoverService } from '@theia/core/lib/browser/hover-service';
import { ContextKeyService } from '@theia/core/lib/browser/context-key-service';
import { TeacherStatusBar } from './teacher-status-bar';
import { TeacherTabBarRenderer } from './teacher-tab-bar-renderer';
import { TeacherSidePanelHandler } from './teacher-side-panel-handler';
import { TeacherMenuBarContribution } from './teacher-menu-bar';
import { TeacherQuickInputStyling } from './teacher-quick-input';
import { TeacherFocusModeContribution } from './teacher-focus-mode';
import { PulsePanelWidget } from './pulse-panel-widget';
import { PulsePanelContribution } from './pulse-panel-contribution';
import { ChatWelcomeMessageProvider } from '@theia/ai-chat-ui/lib/browser/chat-tree-view';
import { TeacherChatWelcomeProvider } from './teacher-chat-welcome';
import { AgentModeService } from './agent-mode-service';
import { AgentSessionManager } from './agent-session-manager';
import { AgentContextProvider } from './agent-context-provider';
import { AgentCommandContribution } from './agent-commands';
import { AgentsMdProvider } from './agents-md-provider';

const TeacherUIPreferencesSchema: PreferenceSchema = {
    properties: {
        'editor.fontFamily': {
            type: 'string',
            default: 'Geist Mono',
            description: 'Controls the font family used in the editor.'
        }
    }
};

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
    // === Layer A: Agent-First Services (singletons) ===

    // AgentModeService — permission matrix + mode cycling (Shift+Tab)
    bind(AgentModeService).toSelf().inSingletonScope();

    // AgentSessionManager — actions, checkpoints, plans
    bind(AgentSessionManager).toSelf().inSingletonScope();

    // AgentContextProvider — IDE state for agent context injection (Flow Awareness)
    bind(AgentContextProvider).toSelf().inSingletonScope();

    // AGENTS.md Provider — workspace-level agent instructions
    bind(AgentsMdProvider).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(AgentsMdProvider);

    // Agent Commands + Keybindings (Shift+Tab, Cmd+Shift+C, Cmd+Shift+Z, etc.)
    bind(AgentCommandContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(AgentCommandContribution);
    bind(KeybindingContribution).toService(AgentCommandContribution);

    // === Layer C: DI Rebinds ===

    // 1. StatusBar → TeacherStatusBar (agent mode indicator, action counter, session timer)
    bind(TeacherStatusBar).toSelf().inSingletonScope();
    rebind(StatusBar).toService(TeacherStatusBar);

    // 2. TabBarRenderer → TeacherTabBarRenderer (rounded tabs, amber underline, hidden close)
    // Must create NEW instance per call (not singleton) — each tab bar gets its own renderer
    rebind(TabBarRendererFactory).toFactory(({ container }) => () => {
        const contextMenuRenderer = container.get(ContextMenuRenderer);
        const decoratorService = container.get(TabBarDecoratorService);
        const iconThemeService = container.get(IconThemeService);
        const selectionService = container.get(SelectionService);
        const commandService = container.get<CommandService>(CommandService);
        const corePreferences = container.get<CorePreferences>(CorePreferences);
        const hoverService = container.get(HoverService);
        const contextKeyService = container.get<ContextKeyService>(ContextKeyService);
        return new TeacherTabBarRenderer(
            contextMenuRenderer, decoratorService, iconThemeService,
            selectionService, commandService, corePreferences, hoverService, contextKeyService
        );
    });

    // 3. SidePanelHandler → TeacherSidePanelHandler (rail class, immovable tabs)
    rebind(SidePanelHandler).to(TeacherSidePanelHandler);

    // 4. MenuBar → Hidden on web, replaced by brand wordmark
    bind(TeacherMenuBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(TeacherMenuBarContribution);

    // 5. QuickInput → Glass material via MutationObserver
    bind(TeacherQuickInputStyling).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(TeacherQuickInputStyling);

    // 6. Focus Mode toggle (Cmd+Shift+F)
    bind(TeacherFocusModeContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(TeacherFocusModeContribution);
    bind(KeybindingContribution).toService(TeacherFocusModeContribution);

    // 7. Chat welcome message → Teacher courses + prompts
    bind(TeacherChatWelcomeProvider).toSelf().inSingletonScope();
    bind(ChatWelcomeMessageProvider).toService(TeacherChatWelcomeProvider);

    // === Widgets ===

    // Pulse Panel
    bind(PulsePanelWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: PulsePanelWidget.ID,
        createWidget: () => context.container.get<PulsePanelWidget>(PulsePanelWidget),
    })).inSingletonScope();
    bind(PulsePanelContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(PulsePanelContribution);

    // === Preferences ===
    bind(PreferenceContribution).toConstantValue({ schema: TeacherUIPreferencesSchema });
});
