import { injectable } from '@theia/core/shared/inversify';
import { SidePanelHandler } from '@theia/core/lib/browser/shell/side-panel-handler';
import { SideTabBar } from '@theia/core/lib/browser/shell/tab-bars';

/**
 * Enhanced side panel handler for the agent-first IDE.
 *
 * Adds:
 *   - teacher-workbench-rail class for pill-shaped icons
 *   - Immovable tabs (no drag reorder)
 *   - Default panel arrangement hints for agent workflow:
 *       Left:   Explorer, Skill Launcher, Search
 *       Right:  AI Chat, Learned Concepts, Permission Mode
 *       Bottom: Pulse Panel, Terminal, AI Timeline
 */
@injectable()
export class TeacherSidePanelHandler extends SidePanelHandler {

    /**
     * Default left sidebar view order for agent IDE.
     * These IDs correspond to widget contribution IDs.
     */
    static readonly LEFT_PANEL_VIEWS = [
        'explorer',             // File Explorer
        'skill-command-widget', // Skill Launcher
        'search',               // Search
    ];

    /**
     * Default right sidebar view order for agent IDE.
     */
    static readonly RIGHT_PANEL_VIEWS = [
        'ai-chat',                  // AI Chat
        'teachable-moments-widget', // Learned Concepts
        'permission-mode-widget',   // Permission Mode
    ];

    /**
     * Default bottom panel view order for agent IDE.
     */
    static readonly BOTTOM_PANEL_VIEWS = [
        'pulse-panel-widget',       // Pulse Panel
        'terminal',                 // Terminal
        'ghost-timeline-widget',    // AI Timeline
    ];

    protected override createSideBar(): SideTabBar {
        const sideBar = super.createSideBar();
        sideBar.addClass('teacher-workbench-rail');
        sideBar.tabsMovable = false;
        return sideBar;
    }
}
