import { injectable } from '@theia/core/shared/inversify';
import { SidePanelHandler } from '@theia/core/lib/browser/shell/side-panel-handler';
import { SideTabBar } from '@theia/core/lib/browser/shell/tab-bars';

@injectable()
export class TeacherSidePanelHandler extends SidePanelHandler {

    protected override createSideBar(): SideTabBar {
        const sideBar = super.createSideBar();
        sideBar.addClass('teacher-workbench-rail');
        sideBar.tabsMovable = false;
        return sideBar;
    }
}
