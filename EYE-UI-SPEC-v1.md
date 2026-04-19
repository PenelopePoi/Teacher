# Eye UI — Teacher IDE Design Specification

**Direction:** Glassmorphic Industrial — Zed × Teenage Engineering × Ableton
**Users:** Beginners and creatives crossing into code (Aurality + XELA audience)
**Priority:** AI-assist integration → Theming/visual language → Layout → Editor → Collaboration

---

## 1. Theia-to-Teacher Gap List

Stock Theia betrays its VS Code lineage at these specific override points:

### Chrome & Shell
| VS Code Tell | Override Point | Teacher Direction |
|---|---|---|
| Activity bar (left icon rail) | `ApplicationShell.leftPanelHandler` | Replace with floating radial dock (Ableton session-view feel). Icons become glowing glyphs, not flat codicons |
| Status bar (bottom) | `StatusBar` widget | Collapse to a single ambient line — pulse color shows AI state (thinking/ready/error). No git branch spam |
| Tab bar (editor tabs) | `TabBarRenderer` | Tabs become capsule pills with rounded ends. Active tab gets a soft glow underline, not a bright border-top |
| Title bar | `WindowTitleWidget` | Remove breadcrumb clutter. Show only: project name + AI status dot + one action button |
| Sidebar panels | `ViewContainer` headers | Headers become translucent frosted-glass bars. Section collapse uses smooth spring animation |
| Right-click menus | `BrowserContextMenuRenderer` | Rounded corners (8px), backdrop-blur, reduced item density. Group with thin dividers not thick borders |
| Command palette | `QuickInputService` | Full-width modal with frosted overlay. Results render with syntax-highlighted previews |
| Notification toasts | `NotificationManager` | Slide in from top-right with spring physics. Glassmorphic cards, not flat rectangles |

### Editor Surface (Monaco)
| VS Code Tell | Override | Teacher Direction |
|---|---|---|
| Gutter (line numbers) | Monaco editor options | Relative line numbers off by default. Show breakpoint dots as soft circles, not hard rectangles |
| Minimap | `editor.minimap.enabled` | Off by default. Beginners don't need it — it's visual noise |
| Scrollbar | Monaco CSS `.monaco-scrollable-element` | Thin (4px), rounded, only visible on hover. Match Figma/Framer scroll behavior |
| Bracket matching | `editor.bracketPairColorization` | Use soft pastel highlights, not saturated neon |
| Error squiggles | `editor.inlineSuggest` | Replace harsh red underlines with gentle amber waves. Beginners panic at red |
| Cursor | `editor.cursorStyle` | Soft block cursor with slight glow (Zed-style). Blink = slow pulse, not hard flash |

### Panels & Views
| VS Code Tell | Override | Teacher Direction |
|---|---|---|
| Terminal | `TerminalWidget` | Dark glass panel. Font = JetBrains Mono or Berkeley Mono. Prompt shows a `▸` not `$` |
| Output/Debug console | Output panel | Merge into unified "System" panel with tab pills |
| Problems panel | Marker view | Rename to "Issues" — show count as badge on activity icon, not a separate noisy panel |
| Explorer tree | FileNavigatorWidget | Simplify to show only workspace files. Hide node_modules by default. Add file-type color dots |

### CSS Variables to Override (the actual work)
```css
/* Core palette — Glassmorphic Industrial */
--theia-editor-background: #0a0a0f;           /* Near-black with blue undertone */
--theia-editor-foreground: #e2e0eb;           /* Warm off-white */
--theia-sideBar-background: rgba(15, 15, 25, 0.85);  /* Translucent dark */
--theia-panel-background: rgba(12, 12, 20, 0.9);
--theia-activityBar-background: rgba(10, 10, 18, 0.7);
--theia-statusBar-background: rgba(10, 10, 18, 0.5);
--theia-titleBar-activeBackground: rgba(10, 10, 18, 0.95);

/* Accent — Indigo/Violet (matches Teacher logo gradient) */
--theia-focusBorder: #6366f1;
--theia-textLink-foreground: #818cf8;
--theia-button-background: #6366f1;
--theia-progressBar-background: #6366f1;
--theia-badge-background: #4f46e5;

/* Glass effects (requires CSS backdrop-filter support) */
--teacher-glass-blur: 16px;
--teacher-glass-bg: rgba(20, 20, 35, 0.65);
--teacher-glass-border: rgba(255, 255, 255, 0.08);
--teacher-glass-highlight: rgba(255, 255, 255, 0.04);

/* Softer diagnostics */
--theia-editorError-foreground: #f59e0b;      /* Amber, not red */
--theia-editorWarning-foreground: #fbbf24;
--theia-editorInfo-foreground: #818cf8;

/* Motion tokens */
--teacher-spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--teacher-ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--teacher-duration-fast: 150ms;
--teacher-duration-normal: 250ms;
--teacher-duration-slow: 400ms;
```

---

## 2. AI Surface Innovation

### What exists now (stock Theia AI chat)
- Sidebar chat panel with text input
- Agent selection dropdown
- Tool call confirmation dialogs
- No inline editor integration
- No ghost text / autocomplete preview

### What Teacher needs

#### Ghost Text (Zed/Cursor pattern, adapted for beginners)
- **Show completions as faded text ahead of cursor** — but with a key difference: include a one-line explanation tooltip above the ghost text
- `// This loops through each item in the array` appears as a tooltip while `for (const item of items) {` appears as ghost text
- Accept with Tab, dismiss with Esc, see explanation with hover
- **Confidence indicator**: ghost text opacity maps to model confidence (90% = nearly solid, 50% = very faint)

#### Canvas-Native Patterns (v0/Bolt adapted)
- **Preview pane**: When the AI generates a component or page, show a live preview split-pane (like v0's preview). Use an iframe sandbox for HTML/CSS/JS output
- **Diff-as-story**: Instead of a raw diff, show changes as an animated sequence: "I added a function here" → highlight → "then connected it here" → highlight. Beginners can't read diffs
- **"What changed" summary**: After any AI edit, a small card appears showing: what changed, why, and what the student should learn from it

#### What beginners need that power tools don't give them
- **"Why?" button on every AI suggestion** — one tap shows the reasoning, not just the code
- **Confidence meter** — visual indicator of how sure the AI is. Beginners trust AI blindly; showing uncertainty teaches critical thinking
- **Undo with explanation** — undo doesn't just revert, it says "I removed the async/await because the function didn't need to be asynchronous"
- **"Try it yourself" mode** — AI pauses and says "based on what we just did, try writing the next function yourself. I'll check it when you're done"

---

## 3. Eye UI Spatial Patterns

### Ambient AI Presence (not boxed)

The AI shouldn't live in a sidebar chat box. It should be *ambient* — present everywhere, visible nowhere specific.

#### Presence indicators
- **Cursor aura**: When AI is analyzing your code, a subtle radial gradient appears around your cursor (like a soft flashlight). Color = thinking. Stillness = ready.
- **Margin whispers**: Instead of chat, the AI can leave small annotations in the editor margin — clickable dots that expand into explanations. Like code review comments but from your tutor.
- **Status pulse**: The bottom bar pulses gently when the AI has something to say but isn't interrupting. Click to see what it noticed.
- **Ambient sound** (optional): A soft tone when AI finishes processing. Different tones for success/warning/error. Aurality DNA.

#### Spatial layout (Vision Pro / AR-informed)
- **Floating panels**: Panels can be detached and float with slight parallax depth (CSS transform + shadow scaling). Not flat windows — layered glass cards.
- **Z-depth hierarchy**: Active panel = z:3 (closest, sharpest), secondary = z:2 (slightly blurred bg), ambient = z:1 (most blurred). Creates spatial depth without VR.
- **Glanceable info cards**: Small cards that appear near relevant code (like Humane pin UI) — showing type info, docs preview, or AI suggestions. Hover to expand, click to pin.
- **Contextual surfaces**: The right panel changes based on what you're doing — editing shows AI suggestions, debugging shows variable watch, browsing shows docs. One panel, many faces.

---

## 4. Beginner-First Creative-Tool Cues

What Ableton, Figma, Spline, Rive, and Framer do that IDEs refuse to:

### Direct manipulation
- **Drag values**: Numeric values in code should be draggable (like Figma's number inputs). Drag a `width: 200` and see the preview update live.
- **Color pickers inline**: Click a hex color in code → inline color picker appears. Not a separate tool — *in the code*.
- **Visual margin/padding**: When editing CSS, show a box-model overlay on the preview. Click the margin area to change it.

### Progressive disclosure
- **Complexity levels**: UI has 3 modes — Beginner (minimal panels, big buttons, AI always visible), Intermediate (standard layout), Advanced (full Theia power). User graduates between them.
- **Feature discovery**: New features appear as gentle glowing dots on the activity bar. Click to learn what they do. Don't dump 50 icons on a beginner.
- **Contextual toolbars**: Instead of permanent toolbar with 30 buttons, show only the 3-5 actions relevant to what you're doing right now. Like Figma's context-sensitive toolbar.

### Emotional design
- **Progress celebration**: When a beginner completes a lesson or gets code running, subtle particle burst + haptic feedback (on supported devices). Ableton does this with clip launch animations.
- **Error compassion**: Error messages rewritten in plain English. Not `TypeError: Cannot read properties of undefined (reading 'map')` but `The code tried to use .map() on something that doesn't exist yet. Check that your data loaded before this line runs.`
- **Visual heartbeat**: The IDE has a subtle ambient animation — a slow breathing glow in the background, barely perceptible, that makes the environment feel alive. Teenage Engineering's OP-1 does this with its screen animations.

### Non-code creation
- **Visual component builder**: Drag-and-drop UI components into a canvas, then see the generated code. Like Framer's component mode but with the code visible.
- **Audio-reactive coding** (Aurality DNA): While coding in Aurality Studio, the editor background can subtly respond to audio — bass hits cause a barely-visible pulse. Coding feels like creating music.

---

## 5. The Eye-to-IDE Handshake

"Eye" = the capture/ambient surface. "IDE" = the workspace. The handshake is how ideas flow between them.

### Voice capture → IDE-ready state
- **Voice notes**: Press a hardware key (or keyboard shortcut) to speak an idea. AI transcribes → creates a TODO item in the IDE → optionally generates a code scaffold.
- **"Build this"**: Say "build a login form with email and password" → AI generates the component → opens it in the editor → shows preview. The voice was the prompt, the IDE is the workspace.
- **Ambient dictation**: While coding, speak comments naturally. AI transcribes and inserts them as properly formatted code comments at cursor position.

### Continuity patterns
- **Session persistence**: Close the IDE, reopen it — everything is exactly where you left it. Every tab, every cursor position, every AI conversation. Not just "restore layout" — restore *state*.
- **Cross-device continuity** (future): Start on desktop, glance at phone for AI suggestion, continue on tablet. Apple Continuity / Arc handoff model. Requires cloud sync layer.
- **Capture-to-workspace**: Anything captured in Eye (voice note, screenshot annotation, sketch) appears as a "captured" item in the IDE workspace panel, ready to be converted into code.

### The handshake protocol
```
Eye captures intent → AI processes → IDE receives structured artifact
     ↑                                        ↓
     └──── IDE state reflects back to Eye ────┘
```

Every artifact has: `source` (voice/sketch/text), `intent` (what the user wants), `artifact` (generated code/component/config), `confidence` (how sure the AI is), `alternatives` (other approaches).

---

## 6. Shared DNA Spec — The "Teacher" Language

### Color System

| Role | Value | Usage |
|---|---|---|
| **Canvas** | `#0a0a0f` | Editor background, primary surface |
| **Surface 1** | `rgba(15, 15, 25, 0.85)` | Sidebars, panels (glassmorphic) |
| **Surface 2** | `rgba(20, 20, 35, 0.65)` | Floating cards, tooltips |
| **Surface 3** | `rgba(30, 30, 50, 0.45)` | Hover states, subtle highlights |
| **Text Primary** | `#e2e0eb` | Code, headings, primary content |
| **Text Secondary** | `#8b89a0` | Comments, labels, descriptions |
| **Text Tertiary** | `#5a586e` | Disabled, placeholder |
| **Accent** | `#6366f1` | Focus, links, primary actions (Indigo 500) |
| **Accent Light** | `#818cf8` | Hover accent, secondary links (Indigo 400) |
| **Accent Glow** | `rgba(99, 102, 241, 0.15)` | Focus rings, selection bg |
| **Success** | `#34d399` | Tests pass, connected, completed (Emerald 400) |
| **Warning** | `#fbbf24` | Errors (yes, amber not red), caution (Amber 400) |
| **Danger** | `#f87171` | Destructive actions only, not errors (Red 400) |
| **AI Thinking** | `#c084fc` | AI processing indicator (Purple 400) |
| **AI Ready** | `#6366f1` | AI idle, ready for input |

### Typography

| Role | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| **Code** | Berkeley Mono / JetBrains Mono / Fira Code | 13px | 400 | 0 |
| **UI Headings** | Inter / SF Pro Display | 14-22px | 600 | -0.02em |
| **UI Body** | Inter / SF Pro Text | 12-13px | 400 | 0 |
| **UI Labels** | Inter / SF Pro Text | 11px | 500 | 0.04em (uppercase) |
| **Monospace UI** | Berkeley Mono | 12px | 400 | 0.02em |

### Motion

| Pattern | Duration | Easing | Usage |
|---|---|---|---|
| **Micro** | 100-150ms | `ease-out` | Button press, toggle, hover |
| **Standard** | 200-300ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Panel open/close, tab switch |
| **Spring** | 300-500ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Notification enter, celebration |
| **Ambient** | 2000-4000ms | `ease-in-out` | Background pulse, AI thinking glow |
| **Parallax** | Continuous | `linear` | Z-depth panel movement on scroll |

All motion respects `prefers-reduced-motion: reduce` — falls back to instant transitions.

### Icon Language

Replace generic codicons with a custom set that reads as "Teacher":

| Concept | Stock Codicon | Teacher Eye Icon |
|---|---|---|
| AI/Tutor | `codicon-hubot` (robot) | Eye glyph — the "eye" from Eye UI |
| Learn | `codicon-book` | Open book with a light beam |
| Progress | `codicon-graph` | Rising path with checkpoints |
| Code | `codicon-code` | Brackets with a pulse line between |
| Run | `codicon-play` | Rounded triangle with glow |
| Error | `codicon-error` | Soft circle with "?" not "!" — errors are questions, not accusations |
| Skills | `codicon-library` | Grid of small glowing cards |

### Glass Effects

```css
.teacher-glass {
    background: var(--teacher-glass-bg);
    backdrop-filter: blur(var(--teacher-glass-blur));
    -webkit-backdrop-filter: blur(var(--teacher-glass-blur));
    border: 1px solid var(--teacher-glass-border);
    border-radius: 12px;
    box-shadow:
        0 0 0 1px var(--teacher-glass-highlight) inset,
        0 8px 32px rgba(0, 0, 0, 0.3);
}

.teacher-glass-elevated {
    background: rgba(25, 25, 40, 0.75);
    backdrop-filter: blur(24px);
    box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.06) inset,
        0 16px 48px rgba(0, 0, 0, 0.4);
}
```

### Sound Design (optional, Aurality DNA)

| Event | Sound | Duration |
|---|---|---|
| AI suggestion ready | Soft chime, C major | 200ms |
| Code compiles | Low confirmation tone | 150ms |
| Error | Gentle two-note descend | 300ms |
| Lesson complete | Warm chord swell | 800ms |
| Ambient idle | Barely perceptible pad | Loop |

All sound is off by default. Opt-in via settings. Volume tied to `teacher.audio.enabled` and `teacher.audio.volume` preferences.

---

## Implementation Priority

### Phase 1 — Identity (week 1)
1. Custom Theia theme JSON (dark_teacher.json) with the color system above
2. Glass CSS overrides in teacher.css for sidebar, panels, tabs
3. Replace remaining Theia logos/favicons with Teacher branding
4. Typography: load Inter + Berkeley Mono, apply to editor + UI

### Phase 2 — AI Surface (week 2)
5. Ghost text with explanation tooltip (Monaco decoration provider)
6. Margin whisper annotations (Monaco glyph margin provider)
7. Status pulse in bottom bar (CSS animation + AI state binding)
8. "Why?" button on AI suggestions

### Phase 3 — Beginner UX (week 3)
9. Complexity levels (Beginner/Intermediate/Advanced preference)
10. Compassionate error messages (error message rewriter service)
11. Progress celebration animations
12. Feature discovery dots

### Phase 4 — Spatial & Polish (week 4)
13. Floating panel mode with z-depth
14. Contextual toolbar
15. Drag-to-edit values
16. Inline color picker
17. Voice capture prototype

---

*This spec is the blueprint. Each section becomes a set of concrete PRs against the Teacher codebase.*
*The goal: a beginner opens Teacher and it feels like opening Ableton, not VS Code.*
