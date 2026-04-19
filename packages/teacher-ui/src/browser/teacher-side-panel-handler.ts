import { injectable, postConstruct } from '@theia/core/shared/inversify';
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
 *
 * Enhancements over v1:
 *   - Panel collapse/expand memory (persists preferred panel state)
 *   - Minimum panel width enforcement (prevents side panels from crushing)
 *   - Panel arrangement validation (logs if expected views are missing)
 *   - Active indicator animation (amber glow on active tab)
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

    /** Minimum width in pixels for side panels. */
    static readonly MIN_PANEL_WIDTH = 240;

    /** Storage key for panel collapse state. */
    private static readonly PANEL_STATE_KEY = 'teacher.panelCollapsed';

    @postConstruct()
    protected initTeacher(): void {
        // Enforce minimum panel widths
        this.enforceMinimumWidth();
    }

    protected override createSideBar(): SideTabBar {
        const sideBar = super.createSideBar();
        sideBar.addClass('teacher-workbench-rail');
        sideBar.tabsMovable = false;

        // Add the agent-first rail indicator
        sideBar.addClass('teacher-agent-rail');

        return sideBar;
    }

    /**
     * Validate that expected views are present in the panels.
     * Call after all contributions have been registered.
     */
    validatePanelArrangement(): void {
        const tabBar = this.tabBar;
        if (!tabBar) {
            return;
        }
        const presentIds = new Set<string>();
        for (let i = 0; i < tabBar.titles.length; i++) {
            const title = tabBar.titles[i];
            if (title.owner) {
                presentIds.add(title.owner.id);
            }
        }

        const allExpected = [
            ...TeacherSidePanelHandler.LEFT_PANEL_VIEWS,
            ...TeacherSidePanelHandler.RIGHT_PANEL_VIEWS,
        ];
        const missing = allExpected.filter(id => !presentIds.has(id));
        if (missing.length > 0) {
            console.info('[TeacherSidePanelHandler] Panel views not yet registered:', missing.join(', '));
        }
    }

    /**
     * Save the current panel collapse state to localStorage.
     */
    savePanelState(collapsed: boolean): void {
        try {
            localStorage.setItem(TeacherSidePanelHandler.PANEL_STATE_KEY, String(collapsed));
        } catch {
            // localStorage not available
        }
    }

    /**
     * Restore panel collapse state from localStorage.
     */
    restorePanelState(): boolean {
        try {
            return localStorage.getItem(TeacherSidePanelHandler.PANEL_STATE_KEY) === 'true';
        } catch {
            return false;
        }
    }

    /**
     * Enforce minimum width on side panels to prevent content crushing.
     */
    private enforceMinimumWidth(): void {
        // Apply via CSS custom property — picked up by the teacher-shell.css
        const root = document.documentElement;
        if (root) {
            root.style.setProperty(
                '--teacher-side-panel-min-width',
                `${TeacherSidePanelHandler.MIN_PANEL_WIDTH}px`
            );
        }
    }
}
