import { injectable, inject } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { WidgetManager } from '@theia/core/lib/browser/widget-manager';
import { PulsePanelWidget } from './pulse-panel-widget';

/**
 * Registers the Pulse Panel widget in the bottom panel area on application start.
 */
@injectable()
export class PulsePanelContribution implements FrontendApplicationContribution {

    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    async onStart(app: FrontendApplication): Promise<void> {
        const widget = await this.widgetManager.getOrCreateWidget(PulsePanelWidget.ID);
        if (widget) {
            app.shell.addWidget(widget, { area: 'bottom' });
        }
    }
}
