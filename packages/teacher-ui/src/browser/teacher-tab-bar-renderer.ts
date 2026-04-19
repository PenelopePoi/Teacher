import { injectable } from '@theia/core/shared/inversify';
import { TabBarRenderer, SideBarRenderData } from '@theia/core/lib/browser/shell/tab-bars';
import { VirtualElement, h } from '@lumino/virtualdom';
import { PINNED_CLASS } from '@theia/core/lib/browser/widgets';
import { nls } from '@theia/core/lib/common/nls';

@injectable()
export class TeacherTabBarRenderer extends TabBarRenderer {

    override renderTab(data: SideBarRenderData, isInSidePanel?: boolean, isPartOfHiddenTabBar?: boolean): VirtualElement {
        const isHorizontal = this.tabBar?.orientation === 'horizontal';
        const tabCloseIconStart = isHorizontal && this.corePreferences?.['window.tabCloseIconPlacement'] === 'start';

        const title = data.title;
        const id = this.createTabId(title, isPartOfHiddenTabBar);
        const key = this.createTabKey(data);
        const style = this.createTabStyle(data);
        const baseClass = this.createTabClass(data);
        const className = `${baseClass} teacher-tab${tabCloseIconStart ? ' closeIcon-start' : ''}`;
        const dataset = this.createTabDataset(data);
        const closeIconTitle = data.title.className.includes(PINNED_CLASS)
            ? nls.localizeByDefault('Unpin')
            : nls.localizeByDefault('Close');

        const hover = {
            onmouseenter: this.handleMouseEnterEvent
        };

        const tabLabel = h.div(
            { className: 'theia-tab-icon-label' },
            this.renderIcon(data, isInSidePanel),
            this.renderLabel(data, isInSidePanel),
            this.renderTailDecorations(data, isInSidePanel),
            this.renderBadge(data, isInSidePanel),
            this.renderLock(data, isInSidePanel)
        );
        const tabCloseIcon = h.div({
            className: 'lm-TabBar-tabCloseIcon action-label teacher-tab-close',
            title: closeIconTitle,
            onclick: this.handleCloseClickEvent,
        });

        const tabContents = tabCloseIconStart ? [tabCloseIcon, tabLabel] : [tabLabel, tabCloseIcon];

        return h.li(
            {
                ...hover,
                key, className, id, style, dataset,
                oncontextmenu: this.handleContextMenuEvent,
                ondblclick: this.handleDblClickEvent,
                onauxclick: (e: MouseEvent) => {
                    e.preventDefault();
                }
            },
            ...tabContents
        );
    }
}
