# Eye UI Design Tokens

Complete reference for Teacher IDE's Glassmorphic Industrial design system.
All tokens are defined in `packages/teacher-ui/src/browser/style/teacher-shell.css`.

## Surface Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--surface-0` | `#0B0D10` | Deepest background: status bar, title bar |
| `--surface-1` | `#12151A` | Primary surface: editor, panels |
| `--surface-2` | `#1A1D22` | Secondary surface: side bar, tab bar |
| `--surface-3` | `#24282F` | Elevated surface: section headers, hover |
| `--surface-4` | `#2A2E35` | Highest elevation: active hover |

## Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#F2F4F7` | Primary text, active labels |
| `--text-secondary` | `#B8BEC7` | Secondary text, descriptions |
| `--text-tertiary` | `#7A828E` | Muted text, line numbers, placeholders |

## Accent Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-amber` | `#E8A948` | Primary accent: tabs, badges, focus borders, activity bar |
| `--ai-thinking` | `#7B9BD1` | AI thinking state (blue) |
| `--ai-suggesting` | `#E8A948` | AI suggesting state (amber) |
| `--ai-confident` | `#4FB286` | AI confident/ready state (green) |

## Border

| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `#23272E` | All panel and widget borders |

## Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--theia-ui-font-family` | `'Geist', system-ui, ...` | All UI text |
| `--theia-ui-font-size1` | `14px` | Default UI font size |
| `--theia-code-font-size` | `15px` | Editor font size |
| `--theia-code-line-height` | `22px` | Editor line height |

Editor font: `Geist Mono` (set via preference, not CSS variable).

## Theia Variable Mappings

Key `--theia-*` overrides (subset):

| Theia Variable | Mapped To |
|---------------|-----------|
| `--theia-activityBar-background` | `--surface-1` |
| `--theia-activityBar-activeBorder` | `--accent-amber` |
| `--theia-editor-background` | `--surface-1` |
| `--theia-sideBar-background` | `--surface-2` |
| `--theia-statusBar-background` | `--surface-0` |
| `--theia-tab-activeBackground` | `--surface-1` |
| `--theia-tab-activeBorderTop` | `--accent-amber` |
| `--theia-focusBorder` | `rgba(232, 169, 72, 0.5)` |
| `--theia-badge-background` | `--accent-amber` |
| `--theia-selection-background` | `rgba(232, 169, 72, 0.2)` |

## Glassmorphic Effects

| Element | Blur | Saturation | Opacity |
|---------|------|------------|---------|
| Status bar | `12px` | `1.5` | `0.85` |
| Dialogs | `16px` | `1.4` | `0.92` |
| Command palette | Applied via MutationObserver | | |

## Animation Tokens

| Name | Duration | Usage |
|------|----------|-------|
| `teacher-breathing-glow` | `2400ms` | Pulse dot idle state, sine wave glow |
| `teacher-thinking-pulse` | `800ms` | AI thinking indicator, scale pulse |

## Geometry

| Element | Value |
|---------|-------|
| Activity bar tab radius | `12px` |
| Dialog radius | `12px` |
| Status bar pill radius | `10px` |
| Scrollbar width | `6px` |
| Tab close icon | Hidden, visible on hover |
| Line number opacity | `0.35` (default), `0.70` (hover/active) |
