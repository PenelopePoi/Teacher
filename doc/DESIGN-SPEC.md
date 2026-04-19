# Teacher IDE — Design Specification

> Glassmorphic Industrial: Zed meets Teenage Engineering meets Ableton.
> Not another VS Code skin. A teaching instrument.

---

## 1. Theia-to-Teacher Gap List — CSS/Layout Override Points

Theia inherits VS Code's visual DNA. Teacher must break from that lineage while keeping Theia's architecture. Here are the specific override points:

### 1.1 Root Variables (`:root` in `packages/core/src/browser/style/index.css`)

| Variable | Theia Default | Teacher Override | Why |
|----------|--------------|-----------------|-----|
| `--theia-ui-font-family` | `Helvetica Neue, Helvetica, Arial` | `'Inter', 'Plus Jakarta Sans', system-ui` | Modern geometric sans — readable, friendly, not corporate |
| `--theia-code-font-family` | `Menlo, Monaco, Consolas` | `'JetBrains Mono', 'Fira Code', monospace` | Ligatures, cleaner glyphs, designed for learning |
| `--theia-ui-font-size1` | `13px` | `14px` | Slightly larger for readability (beginners) |
| `--theia-code-font-size` | `13px` | `15px` | Larger code = less eye strain for learners |
| `--theia-code-line-height` | `17px` | `22px` | More breathing room between lines |
| `--theia-ui-padding` | `6px` | `8px` | More generous spacing |
| `--theia-border-width` | `1px` | `0px` | Borderless — use spacing and shadow instead |
| `--theia-scrollbar-width` | `10px` | `6px` | Thinner, less intrusive scrollbars |
| `--theia-statusBar-height` | `22px` | `28px` | Taller status bar for touch targets |

### 1.2 Activity Bar (`packages/core/src/browser/style/sidepanel.css`)

**Problem:** VS Code's vertical icon strip feels cold and cryptic for beginners.

| Variable | Theia Default | Teacher Override |
|----------|--------------|-----------------|
| `--theia-private-sidebar-tab-width` | `48px` | `56px` |
| `--theia-private-sidebar-icon-size` | `24px` | `20px` |
| `--theia-private-sidebar-tab-padding-top-and-bottom` | `11px` | `14px` |

**CSS Overrides:**
```css
/* Glassmorphic activity bar */
.theia-app-sidebar-container {
    background: color-mix(in srgb, var(--theia-activityBar-background) 80%, transparent);
    backdrop-filter: blur(20px) saturate(1.5);
    -webkit-backdrop-filter: blur(20px) saturate(1.5);
    border-right: none;
    box-shadow: inset -1px 0 0 rgba(255,255,255,0.06);
}

/* Rounded icon containers — Teenage Engineering pill shape */
.theia-app-sides .lm-TabBar-tab {
    border-radius: 12px;
    margin: 2px 6px;
    transition: background 0.15s ease, transform 0.1s ease;
}

.theia-app-sides .lm-TabBar-tab:hover {
    transform: scale(1.05);
}

.theia-app-sides .lm-TabBar-tab.lm-mod-current {
    background: var(--teacher-accent-glow);
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
}
```

### 1.3 Tab Bar (`packages/core/src/browser/style/tabs.css`)

**Problem:** Chrome-style tabs feel like a browser, not a creative tool.

```css
/* Ableton-style flat tabs with subtle active indicator */
.theia-app-centers .lm-TabBar-tab {
    border: none;
    border-radius: 8px 8px 0 0;
    padding: 0 16px;
    font-weight: 500;
    letter-spacing: -0.01em;
    transition: background 0.12s ease;
}

.theia-app-centers .lm-TabBar-tab.lm-mod-current {
    background: var(--theia-editor-background);
    border-bottom: 2px solid var(--teacher-accent-primary);
}

/* Hide the noisy tab close buttons until hover */
.lm-TabBar-tabCloseIcon {
    opacity: 0;
    transition: opacity 0.15s;
}
.lm-TabBar-tab:hover .lm-TabBar-tabCloseIcon {
    opacity: 0.6;
}
```

### 1.4 Editor Area

```css
/* Softer editor with generous padding */
.monaco-editor {
    padding-left: 8px;
}

/* Smoother cursor */
.monaco-editor .cursor {
    border-radius: 2px;
    transition: top 0.08s ease, left 0.08s ease;
}

/* Line numbers: subdued until hover */
.monaco-editor .margin-view-overlays .line-numbers {
    opacity: 0.35;
    transition: opacity 0.2s;
}
.monaco-editor:hover .margin-view-overlays .line-numbers {
    opacity: 0.7;
}
```

### 1.5 Status Bar

```css
/* Glassmorphic status bar */
#theia-statusBar {
    background: color-mix(in srgb, var(--theia-statusBar-background) 75%, transparent);
    backdrop-filter: blur(16px);
    border-top: 1px solid rgba(255,255,255,0.04);
    font-family: var(--teacher-ui-font);
    font-size: 12px;
    letter-spacing: 0.02em;
}

/* Status items with pill shape */
#theia-statusBar .element {
    border-radius: 4px;
    padding: 1px 8px;
    margin: 2px 1px;
}

#theia-statusBar .element:hover {
    background: rgba(255,255,255,0.08);
}
```

### 1.6 Panel (Terminal, Problems, Output)

```css
/* Ableton-style bottom panel with cleaner separation */
#theia-bottom-content-panel {
    border-top: none;
    box-shadow: 0 -1px 0 rgba(255,255,255,0.04);
}

/* Panel tab styling */
#theia-bottom-content-panel .lm-TabBar-tab {
    text-transform: uppercase;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 0 14px;
}
```

### 1.7 Theme Color Tokens

Create `packages/monaco/data/monaco-themes/vscode/dark_teacher.json`:

```json
{
    "name": "Teacher Dark",
    "type": "dark",
    "colors": {
        "editor.background": "#1a1a2e",
        "editor.foreground": "#e0e0e8",
        "sideBar.background": "#16162a",
        "sideBar.foreground": "#a0a0b8",
        "activityBar.background": "#12122400",
        "activityBar.foreground": "#c4b5fd",
        "activityBar.activeBorder": "#6366f1",
        "statusBar.background": "#8b5cf6",
        "statusBar.foreground": "#ffffff",
        "tab.activeBackground": "#1a1a2e",
        "tab.inactiveBackground": "#141428",
        "tab.activeBorderTop": "#6366f1",
        "editorGroupHeader.tabsBackground": "#141428",
        "panel.background": "#141428",
        "panel.border": "#ffffff08",
        "terminal.background": "#12122a",
        "terminal.foreground": "#d0d0e0",
        "focusBorder": "#6366f180",
        "selection.background": "#6366f130",
        "button.background": "#6366f1",
        "button.foreground": "#ffffff",
        "button.hoverBackground": "#818cf8",
        "input.background": "#1e1e38",
        "input.border": "#ffffff10",
        "input.foreground": "#e0e0e8",
        "scrollbarSlider.background": "#ffffff10",
        "scrollbarSlider.hoverBackground": "#ffffff1a",
        "scrollbarSlider.activeBackground": "#6366f140",
        "list.hoverBackground": "#ffffff08",
        "list.activeSelectionBackground": "#6366f130",
        "list.inactiveSelectionBackground": "#6366f118",
        "widget.shadow": "#00000040",
        "titleBar.activeBackground": "#12122a",
        "titleBar.activeForeground": "#c0c0d0"
    }
}
```

---

## 2. AI Surface Innovation

### 2.1 What Exists (and What Beginners Don't Get)

| Tool | AI Surface | What It Misses for Beginners |
|------|-----------|------------------------------|
| **Cursor** | Ghost text, inline diff, Cmd+K | Assumes you know what to ask. No guidance. |
| **v0/Bolt/Lovable** | Canvas-native, full-page generation | Skips the learning — you get code but don't understand it |
| **Zed** | Inline assistant, fast edit | Power-user UX, no scaffolding for novices |
| **GitHub Copilot** | Tab-complete suggestions | Passive. Never explains. Never teaches. |

### 2.2 Teacher's AI Surfaces (What Beginners Need)

**a) The Margin Tutor — Ambient Annotations**
Instead of ghost-text that suggests *what to type*, show margin annotations that explain *what you're looking at*. Non-intrusive. Always present. Contextual.

```
Implementation: Monaco decoration API (IEditorDecorationsCollection)
Trigger: Cursor dwell > 1.5s on any line
Content: One-line plain-English explanation from the Explain Agent
Position: Right margin, 40% opacity, fades in
Dismissal: Typing resumes = fade out instantly
```

**b) The Learning Rail — Guided Progress Strip**
A thin horizontal strip above the editor (below tabs) showing lesson progress. Clickable segments. Visual breadcrumb of where you are in the curriculum.

```
Position: Between tab bar and editor (new widget area)
Height: 4px collapsed, 32px expanded on hover
Content: Lesson objectives as chips, progress indicator, hint button
Visual: Gradient fill left-to-right as you complete objectives
```

**c) Canvas Explanations (Not Just Text)**
When the Tutor explains a concept, render it as a visual canvas — not a chat bubble:

- **Code flow diagrams** — Show execution path with animated arrows
- **Variable state tables** — Live-updating values as code runs
- **Concept maps** — How this function connects to other concepts
- **Before/After diffs** — Show what your change does visually

```
Implementation: Custom ReactWidget rendered in a split pane
Trigger: "Explain This" command or Tutor response
Renderer: React + SVG for diagrams, CSS grid for tables
```

**d) Ghost Hints (Not Ghost Code)**
Instead of suggesting complete code (which teaches nothing), suggest *what to think about next*:

```
// You're inside a for loop.
// What happens to `total` each time through?
// Try: print(total) here to see it change ←── ghost hint
```

```
Implementation: Monaco inline decorations (afterLineDecoration)
Style: Italic, 30% opacity, indigo tint
Trigger: Student pauses > 3s while inside a TODO block
Content: Generated by Tutor Agent with lesson context
```

---

## 3. Eye UI Spatial Patterns

### 3.1 AR Coding Experiments (Vision Pro, Spatial Computing)

**Ambient AI Presence:**
The AI isn't a chat box. It's a spatial presence — like a teaching assistant standing beside you.

- **Peripheral glow** — When the AI is "thinking," the editor border subtly pulses indigo
- **Breath animation** — The AI status indicator breathes (scale 1.0 → 1.02, 2s cycle) when active
- **Spatial sound cues** — Subtle audio feedback on lesson completion, hint reveal, assessment pass

```css
/* AI presence indicator — breathing dot */
.teacher-ai-presence {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--teacher-accent-primary);
    animation: teacher-breathe 3s ease-in-out infinite;
}

@keyframes teacher-breathe {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.15); box-shadow: 0 0 12px var(--teacher-accent-glow); }
}

/* AI thinking state — editor border pulse */
.teacher-ai-thinking .monaco-editor {
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.15);
    animation: teacher-think-pulse 1.5s ease-in-out infinite;
}

@keyframes teacher-think-pulse {
    0%, 100% { box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.08); }
    50% { box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.25); }
}
```

### 3.2 Glanceable Info Design (Humane, Ray-Ban Meta)

**Status at a glance — what a student needs to see in 0.5 seconds:**

1. **Am I on track?** — Progress bar in the Learning Rail (green = good, amber = behind)
2. **What's my next step?** — Current objective in status bar (always visible)
3. **Is help available?** — AI presence indicator (breathing = ready, pulse = thinking)
4. **How long have I been at this?** — Timer in status bar (no judgment, just awareness)

### 3.3 Windowing Patterns (Apple Continuity, Arc)

**Single-focus mode** — For beginners, hide everything except:
- The editor
- The Learning Rail
- The AI chat (collapsible)
- The terminal (collapsible)

No file tree. No activity bar. No status bar clutter. Just the code and the guide.

```css
/* Focus mode — activated by lesson or manually */
.teacher-focus-mode .theia-app-sidebar-container { display: none; }
.teacher-focus-mode #theia-statusBar .area.right { display: none; }
.teacher-focus-mode .theia-app-centers .lm-TabBar { height: 0; overflow: hidden; }
.teacher-focus-mode .monaco-editor { padding-top: 16px; }
```

---

## 4. Beginner-First Creative-Tool Cues

### 4.1 What Creative Tools Do That IDEs Refuse To

| Tool | Pattern | What It Teaches Us |
|------|---------|-------------------|
| **Ableton** | Session View vs Arrangement View | Two views of the same data — experiment mode vs linear mode |
| **Figma** | Multiplayer presence dots | You're never alone. Collaboration is ambient. |
| **Spline / Rive** | Direct manipulation | Drag, don't type. See the result immediately. |
| **Framer** | Component-first | Build with blocks before writing code |
| **Notion** | Slash commands | Discoverability through `/` — everything is findable |

### 4.2 Teacher Translations

**a) Session Mode (from Ableton)**
A visual block-based view where students arrange code blocks before writing syntax. Drag function blocks, connect inputs/outputs, see data flow. Then "flatten" to real code.

**b) Presence (from Figma)**
When AI agents are active, show their presence as small labeled dots in the margin:
- `T` (Tutor) — watching, ready to help
- `R` (Reviewer) — analyzing your code
- `E` (Explain) — available on selection

**c) Slash Discovery (from Notion)**
In the editor, typing `/` opens a command palette filtered to Teacher commands:
- `/explain` — Explain selected code
- `/hint` — Get next hint
- `/check` — Run assessment
- `/tutor` — Open tutor chat
- `/lesson` — Browse lessons

**d) Immediate Feedback (from Spline)**
Every keystroke in a web lesson shows the result in a side-by-side preview. No manual refresh. No build step. The connection between code and output is instant and visible.

---

## 5. The Eye-to-IDE Handshake

### 5.1 Voice Capture to IDE-Ready State

**Pattern:** Say it → Capture it → IDE has it ready

```
"Hey Teacher, I want to learn about for loops"
    ↓ (Speech-to-text via Web Speech API or Whisper)
    ↓ Parsed intent: { action: "learn", topic: "for-loops" }
    ↓ Matched to curriculum: intro-to-python/loops
    ↓ IDE state: lesson loaded, workspace created, tutor briefed
    ↓ Student sees: lesson ready, first objective highlighted
```

### 5.2 Continuity Patterns

**Apple Continuity model:**
- Start on phone (voice note: "I want to build a calculator")
- Continue on iPad (sketch the UI layout)
- Finish on Mac (Teacher IDE has the lesson queued, starter code ready)

**Arc's handoff model:**
- Teacher Mobile (future) captures ideas as voice/text
- Teacher IDE picks them up as "Inbox" items in the welcome page
- Each item can become a lesson, a project, or a tutor conversation

### 5.3 State Continuity

When a student closes Teacher and returns:
- Resume exactly where they left off (cursor position, open files, lesson progress)
- Show a "Welcome back" toast with: time since last session, current objective, streak count
- If > 24h gap, offer a 30-second recap of what they were working on

---

## 6. Shared DNA Spec — The Teacher Design Language

### 6.1 Color System

```css
:root {
    /* Primary Palette — Indigo/Purple gradient */
    --teacher-accent-primary: #6366f1;      /* Indigo 500 — primary actions */
    --teacher-accent-secondary: #8b5cf6;    /* Violet 500 — secondary accent */
    --teacher-accent-glow: rgba(99, 102, 241, 0.25);  /* Glow/shadow color */

    /* Neutrals — Warm darks (not blue-gray like VS Code) */
    --teacher-bg-deep: #0f0f1a;             /* Deepest background */
    --teacher-bg-base: #1a1a2e;             /* Editor background */
    --teacher-bg-surface: #22223a;          /* Elevated surfaces */
    --teacher-bg-hover: #2a2a45;            /* Hover states */
    --teacher-fg-primary: #e8e8f0;          /* Primary text */
    --teacher-fg-secondary: #a0a0b8;        /* Secondary text */
    --teacher-fg-muted: #606078;            /* Muted text */

    /* Semantic — Teaching-specific */
    --teacher-success: #34d399;             /* Lesson passed, objective met */
    --teacher-warning: #fbbf24;             /* Needs attention, hint available */
    --teacher-error: #f87171;               /* Test failed, error in code */
    --teacher-info: #60a5fa;                /* Informational, neutral guidance */
    --teacher-progress: linear-gradient(90deg, #6366f1, #8b5cf6); /* Progress bars */

    /* Glass — Transparency values */
    --teacher-glass-bg: rgba(26, 26, 46, 0.8);
    --teacher-glass-border: rgba(255, 255, 255, 0.06);
    --teacher-glass-blur: blur(20px);
}
```

### 6.2 Typography

```css
:root {
    /* UI Text */
    --teacher-font-ui: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif;
    --teacher-font-code: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
    --teacher-font-display: 'Plus Jakarta Sans', 'Inter', sans-serif;

    /* Scale — Major Third (1.25) */
    --teacher-text-xs: 11px;
    --teacher-text-sm: 12px;
    --teacher-text-base: 14px;
    --teacher-text-md: 16px;
    --teacher-text-lg: 20px;
    --teacher-text-xl: 25px;
    --teacher-text-2xl: 31px;

    /* Weights */
    --teacher-weight-normal: 400;
    --teacher-weight-medium: 500;
    --teacher-weight-semibold: 600;
    --teacher-weight-bold: 700;

    /* Letter spacing */
    --teacher-tracking-tight: -0.02em;
    --teacher-tracking-normal: 0;
    --teacher-tracking-wide: 0.02em;
    --teacher-tracking-caps: 0.08em;   /* For uppercase labels */
}
```

### 6.3 Motion

```css
:root {
    /* Timing — Snappy but not harsh */
    --teacher-ease-out: cubic-bezier(0.16, 1, 0.3, 1);   /* Expo out — primary */
    --teacher-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1); /* Quint in-out — emphasis */
    --teacher-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Spring — playful */

    /* Durations */
    --teacher-duration-instant: 0.1s;    /* Hover, active states */
    --teacher-duration-fast: 0.15s;      /* Tooltips, dropdowns */
    --teacher-duration-normal: 0.25s;    /* Panels, sidebars */
    --teacher-duration-slow: 0.4s;       /* Page transitions */
    --teacher-duration-breath: 3s;       /* AI breathing animation */
}

/* Motion principles:
   1. Micro-interactions are instant (< 150ms)
   2. Layout shifts are smooth (250ms)
   3. AI state changes are organic (breathing, pulsing)
   4. Reduce motion: respect prefers-reduced-motion
*/

@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

### 6.4 Spacing & Radius

```css
:root {
    /* Spacing — 4px base grid */
    --teacher-space-1: 4px;
    --teacher-space-2: 8px;
    --teacher-space-3: 12px;
    --teacher-space-4: 16px;
    --teacher-space-5: 20px;
    --teacher-space-6: 24px;
    --teacher-space-8: 32px;
    --teacher-space-10: 40px;

    /* Border Radius — Soft but not bubbly */
    --teacher-radius-sm: 4px;       /* Buttons, inputs */
    --teacher-radius-md: 8px;       /* Cards, panels */
    --teacher-radius-lg: 12px;      /* Modals, popovers */
    --teacher-radius-xl: 16px;      /* Welcome cards */
    --teacher-radius-pill: 9999px;  /* Pills, tags */
    --teacher-radius-round: 50%;    /* Avatars, presence dots */
}
```

### 6.5 Shadows & Glass

```css
:root {
    /* Elevation levels */
    --teacher-shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
    --teacher-shadow-md: 0 4px 12px rgba(0,0,0,0.25);
    --teacher-shadow-lg: 0 8px 24px rgba(0,0,0,0.3);
    --teacher-shadow-glow: 0 0 16px var(--teacher-accent-glow);

    /* Glass effect mixin pattern */
    /* Apply: background + backdrop-filter + border */
}

.teacher-glass {
    background: var(--teacher-glass-bg);
    backdrop-filter: var(--teacher-glass-blur);
    -webkit-backdrop-filter: var(--teacher-glass-blur);
    border: 1px solid var(--teacher-glass-border);
}
```

### 6.6 Iconography

**Primary:** Codicons (VS Code icons) — already loaded, consistent with extension ecosystem.

**Teacher-specific additions:**
- Mortar board (`codicon-mortar-board`) — Tutor agent
- Lightbulb (`codicon-lightbulb`) — Explain agent
- Checklist (`codicon-checklist`) — Review agent
- Book (`codicon-book`) — Curriculum
- Milestone (`codicon-milestone`) — Progress
- Flame (`codicon-flame`) — Streak/achievement
- Beaker (`codicon-beaker`) — Experiment/Try It

**Icon treatment:**
- 20px in activity bar
- 16px inline
- 14px in status bar
- Always use `currentColor` — never hardcode icon colors

### 6.7 The Teacher Mark

The Teacher logo mark (book + code symbol) should appear:
- Splash screen (Electron)
- Welcome page header
- Loading spinner (animated mark)
- Favicon
- About dialog

**Loading animation:** The `</>` inside the book mark fades between indigo and violet on a 2s cycle.

---

## Implementation Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | Dark Teacher theme JSON | 2h | Instant visual identity |
| P0 | CSS variable overrides (root) | 2h | Typography, spacing, border-radius |
| P1 | Activity bar glass effect | 1h | Breaks VS Code visual pattern |
| P1 | Tab bar redesign | 1h | Feels like a creative tool |
| P1 | AI presence animation | 1h | Teacher identity in every session |
| P2 | Margin tutor annotations | 4h | AI surface innovation |
| P2 | Learning Rail widget | 4h | Curriculum visibility |
| P2 | Focus mode | 2h | Beginner-first UX |
| P3 | Ghost hints (not ghost code) | 6h | Teaching-first AI |
| P3 | Slash command discovery | 4h | Notion-style discoverability |
| P3 | Canvas explanations | 8h | Visual learning |
| P4 | Voice capture integration | 8h | Eye-to-IDE handshake |
| P4 | Session mode (block-based) | 16h | Ableton-inspired experiment view |

---

*"The code teaches the API; the examples remind us why we build."*

*This spec is a living document. It evolves with the product.*
