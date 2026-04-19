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
        try {
            console.info('[PulsePanelContribution] Registering Pulse Panel widget...');
            const widget = await this.widgetManager.getOrCreateWidget(PulsePanelWidget.ID);
            if (widget) {
                app.shell.addWidget(widget, { area: 'bottom' });
                console.info('[PulsePanelContribution] Pulse Panel widget added to bottom panel.');
            } else {
                console.warn('[PulsePanelContribution] Widget creation returned undefined.');
            }
        } catch (err) {
            console.error('[PulsePanelContribution] Failed to create Pulse Panel widget:', err);
        }
    }
}
