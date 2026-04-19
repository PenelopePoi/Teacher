# Building Teacher: A Dual-Surface Spec for a Theia-Native AI IDE

> Teacher can be shipped as a recognizably non-VS-Code product by stacking three Theia customization layers (tokens → CSS → DI rebinds), then layering a creative-tool vocabulary over a "Glassmorphic Industrial" DNA.

This is the canonical design specification. See doc/DESIGN-SPEC.md for the implementation-focused version.

## Summary of Committed Values

### Color Palette — Warm Industrial Charcoal

| Token | Hex | Usage |
|-------|-----|-------|
| surface-0 | #0B0D10 | Hero/void, status bar |
| surface-1 | #12151A | Workspace background |
| surface-2 | #1A1D22 | Panels, sidebar |
| surface-3 | #24282F | Elevated cards |
| surface-4 | #2A2E35 | Hover/active chips |
| border-subtle | #23272E | 1px dividers |
| text-primary | #F2F4F7 | Primary text |
| text-secondary | #B8BEC7 | Secondary text |
| text-tertiary | #7A828E | Muted text |
| accent-amber | #E8A948 | Primary CTAs, active selection |
| accent-yellow | #F5C518 | Numbered controls, TE chiclets |
| accent-hot | #F57B20 | Destructive, live recording |
| ai-thinking | #7B9BD1 | Model processing |
| ai-suggesting | #E8A948 | Proposal ready |
| ai-confident | #4FB286 | Calm green-teal |
| error | #E5484D | Error states |

### Typography

- UI: Geist (SIL OFL)
- Code: Geist Mono (SIL OFL)
- Display: Geist at heavier weights
- Size ramp: 11/13/14/15/20/32
- Always: font-variant-numeric: tabular-nums

### Motion Signature

- Breathing glow: 2,400ms sine wave (the signature)
- Suggestion pulse: 600ms spring-out
- Command palette: 220ms scale + blur
- Panel transitions: 150ms ease-out
- Token streaming: 30ms/token, no fade
- Canonical curve: cubic-bezier(0.32, 0.72, 0, 1)
- NO SPINNERS. EVER. Indeterminate = breathing glow.

### The Five Cross-Surface Identifiers

1. Breathing glow at exactly 2,400ms sine
2. Amber #E8A948 everywhere attention is claimed
3. Geist family across both substrates
4. TE-style numbered labels (01 · INTENT)
5. No spinners, ever

### DI Rebind Targets (6-10 total)

1. ApplicationShell → sidebar-first rail
2. StatusBar → stripped, Pulse indicator + lesson objective
3. TabBarRenderer → rounded 6px, amber underline
4. QuickInputWidget → glass material + TE numbered categories
5. SidePanelHandler → Arc-style geometry
6. MenuBarWidget → hidden on web, brand wordmark top-left
7. Pulse Panel → new widget contribution

### Eight Novel AI Surfaces

1. Pulse Panel — ambient AI status strip
2. Ghost Timeline — Ableton-style AI undo ribbon
3. Drag-to-Ask — direct manipulation context selection
4. Side-by-Side Before/After Canvas
5. Audio-Reactive Diff (sonification)
6. Teachable Moments — gold underline + explainer cards
7. Voice-to-Change — push-to-talk hover
8. Gesture Scrub — swipe through AI alternatives

### Five Companion Handshake Patterns

1. Voice Intent Drop
2. Glance Pulse
3. Pinned Thought
4. Deploy Gesture
5. Continuity Handback

---

*Full specification with code examples, CSS values, and implementation details is in the main design document. This file is the quick-reference.*
