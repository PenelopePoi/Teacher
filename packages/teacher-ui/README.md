# @theia/teacher-ui

Visual shell overrides for Teacher IDE. Applies the Glassmorphic Industrial design via CSS variables and 7 InversifyJS DI rebinds. The Pulse Panel widget is owned by `@theia/teacher-core`.

## DI Rebinds

| # | Original | Replacement | Effect |
|---|----------|-------------|--------|
| 1 | `StatusBar` | `TeacherStatusBar` | Agent mode indicator, action counter, session timer |
| 2 | `TabBarRendererFactory` | `TeacherTabBarRenderer` | Rounded tabs, amber underline, hidden close icons |
| 3 | `SidePanelHandler` | `TeacherSidePanelHandler` | Sidebar rail class, immovable tabs |
| 4 | -- | `TeacherMenuBarContribution` | Hidden menu bar, brand wordmark |
| 5 | -- | `TeacherQuickInputStyling` | Glass command palette via MutationObserver |
| 6 | -- | `TeacherFocusModeContribution` | Cmd+Shift+F minimal UI toggle |
| 7 | `ChatWelcomeMessageProvider` | `TeacherChatWelcomeProvider` | Teacher courses + prompts in chat |

## Eye UI Design Tokens

Core CSS variables defined in `style/teacher-shell.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--surface-0` | `#0B0D10` | Deepest background (status bar, title bar) |
| `--surface-1` | `#12151A` | Editor background, primary surfaces |
| `--surface-2` | `#1A1D22` | Side bar, tab bar background |
| `--surface-3` | `#24282F` | Section headers, hover states |
| `--surface-4` | `#2A2E35` | Active hover states |
| `--border-subtle` | `#23272E` | Panel and widget borders |
| `--text-primary` | `#F2F4F7` | Primary text |
| `--text-secondary` | `#B8BEC7` | Secondary text, labels |
| `--text-tertiary` | `#7A828E` | Muted text, line numbers |
| `--accent-amber` | `#E8A948` | Accent color (tabs, badges, focus) |
| `--ai-thinking` | `#7B9BD1` | AI thinking state indicator |
| `--ai-suggesting` | `#E8A948` | AI suggesting state indicator |
| `--ai-confident` | `#4FB286` | AI confident/ready state indicator |

Typography: `Geist` (UI), `Geist Mono` (editor). Mapped via `--theia-ui-font-family`.

## Entry Point

Frontend module: `lib/browser/teacher-ui-frontend-module`
