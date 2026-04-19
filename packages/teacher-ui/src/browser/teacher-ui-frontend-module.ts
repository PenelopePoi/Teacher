import '../../src/browser/style/teacher-shell.css';
import '../../src/browser/style/teacher-identity.css';

import { ContainerModule } from '@theia/core/shared/inversify';
import { PreferenceContribution } from '@theia/core';
import {
    FrontendApplicationContribution,
    StatusBar,
    WidgetFactory
} from '@theia/core/lib/browser';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import { TeacherStatusBar } from './teacher-status-bar';
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
    // Rebind StatusBar to TeacherStatusBar
    bind(TeacherStatusBar).toSelf().inSingletonScope();
    rebind(StatusBar).toService(TeacherStatusBar);

    // Pulse Panel Widget
    bind(PulsePanelWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: PulsePanelWidget.ID,
        createWidget: () => context.container.get<PulsePanelWidget>(PulsePanelWidget),
    })).inSingletonScope();

    // Pulse Panel Contribution
    bind(PulsePanelContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(PulsePanelContribution);

    // Preference Contribution: default editor font to Geist Mono
    bind(PreferenceContribution).toConstantValue({ schema: TeacherUIPreferencesSchema });
});
