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
import { TeacherStatusBar } from './teacher-status-bar';
import { TeacherTabBarRenderer } from './teacher-tab-bar-renderer';
import { TeacherSidePanelHandler } from './teacher-side-panel-handler';
import { TeacherMenuBarContribution } from './teacher-menu-bar';
import { TeacherQuickInputStyling } from './teacher-quick-input';
import { TeacherFocusModeContribution } from './teacher-focus-mode';
import { PulsePanelWidget } from './pulse-panel-widget';
import { PulsePanelContribution } from './pulse-panel-contribution';

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
    // === Layer C: DI Rebinds ===

    // 1. StatusBar → TeacherStatusBar (strips confetti, adds Pulse + lesson objective)
    bind(TeacherStatusBar).toSelf().inSingletonScope();
    rebind(StatusBar).toService(TeacherStatusBar);

    // 2. TabBarRenderer → TeacherTabBarRenderer (rounded tabs, amber underline, hidden close)
    bind(TeacherTabBarRenderer).toSelf();
    rebind(TabBarRendererFactory).toFactory(({ container }) => () =>
        container.get(TeacherTabBarRenderer)
    );

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
