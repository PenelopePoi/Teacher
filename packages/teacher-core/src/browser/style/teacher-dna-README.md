# Teacher DNA stylesheets

Implementation of the §6 **Shared Visual DNA** block from the Design Spec v2 (see repo-root `EYE-UI-SPEC.md` / paste context). These sheets ship the committed values — hex codes, motion timings, font stacks — that make both Workshop and Companion read as one product.

## Files

| File | Purpose |
|---|---|
| `teacher-dna-tokens.css`     | Warm charcoal palette + TE amber accents + AI state colors. Rebinds `--theia-*` tokens so stock Theia chrome inherits the palette without custom widget work. |
| `teacher-dna-motion.css`     | Motion curves + the 2,400 ms breathing `@keyframes`. Contains `.teacher-breathing`, `.teacher-listening`, `.teacher-thinking`, `.teacher-suggestion` utility classes. Honors `prefers-reduced-motion`. |
| `teacher-dna-typography.css` | Geist + Geist Mono font stack, tabular-nums on all numeric surfaces, `.teacher-chiclet` and `.teacher-hero-numeric` classes. |

All three are imported by `teacher.css` **after** the existing `teacher-identity.css`, so any collision resolves in favor of the spec.

## Fonts — install Geist

The stylesheets reference `Geist` and `Geist Mono` but do **not** bundle the woff2 binaries. Pick one of these three paths depending on how the product is shipped:

### Option A — system install (fastest, local dev)

```bash
brew install --cask font-geist font-geist-mono
```

Then restart the Theia browser app. The CSS stack falls through to Inter / system fonts automatically if Geist isn't installed, so the UI doesn't break.

### Option B — bundle woff2 in this extension (production)

Download the woff2 files from [Vercel's font site](https://vercel.com/font) (SIL OFL — free and embeddable):

```
packages/teacher-core/src/browser/style/fonts/
  Geist-Variable.woff2
  GeistMono-Variable.woff2
```

Add to `teacher-dna-typography.css` (at the top):

```css
@font-face {
    font-family: "Geist";
    src: url("./fonts/Geist-Variable.woff2") format("woff2-variations");
    font-weight: 100 900;
    font-display: swap;
}

@font-face {
    font-family: "Geist Mono";
    src: url("./fonts/GeistMono-Variable.woff2") format("woff2-variations");
    font-weight: 100 900;
    font-display: swap;
}
```

### Option C — Google Fonts CDN (fastest but network-dependent)

Add to `teacher-dna-typography.css` (at the top):

```css
@import url("https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap");
```

Simplest, but the IDE does a remote fetch on first load. Not appropriate for offline / air-gapped Teacher deployments.

## Pulse — how to use it

The `PulseService` singleton in `../pulse/pulse-service.ts` owns the ambient AI state. The `PulseIndicator` component (`../pulse/pulse-indicator.tsx`) reads it. To light up the orb from your own code:

```ts
import { PulseService } from '../pulse/pulse-service';

@inject(PulseService)
protected readonly pulseService: PulseService;

// when mic opens
this.pulseService.set('listening', { amplitude: 0.7, label: 'Listening…' });

// when long job starts
this.pulseService.set('thinking', { label: 'Thinking (12s)' });

// quick amber attention-grab, auto-returns to prior state
this.pulseService.flashSuggestion(1800, '3 proposals ready');

// reset to ambient breathing
this.pulseService.reset();
```

`<PulseIndicator service={pulse} size={12} showLabel />` will re-render on every state change. `size` defaults to 12 (the §6 peripheral spec). The orb uses CSS animations, not requestAnimationFrame, so it's cheap even at 60fps.

**Rule:** Never use spinners. Loading = breathing glow on the relevant surface. Per spec, this is "the most portable constraint."

## Token cheat sheet — most common tokens

| Purpose | Token | Value |
|---|---|---|
| Workspace background | `--teacher-surface-1` | `#12151A` |
| Panel / sidebar | `--teacher-surface-2` | `#1A1D22` |
| Elevated card | `--teacher-surface-3` | `#24282F` |
| Primary body text | `--teacher-text-primary` | `#F2F4F7` |
| Muted text | `--teacher-text-tertiary` | `#7A828E` |
| Primary accent (CTAs, tabs, focus) | `--teacher-accent-amber` | `#E8A948` |
| Numbered chiclet yellow (TE) | `--teacher-accent-yellow` | `#F5C518` |
| AI thinking | `--teacher-ai-thinking` | `#7B9BD1` (cool periwinkle) |
| AI suggestion ready | `--teacher-ai-suggesting` | `#E8A948` |
| Breathing animation | `.teacher-breathing` | 2400 ms |
| Suggestion pulse | `.teacher-suggestion` | 600 ms spring |

## Materiality rule (§6)

- **Workshop code editor viewport:** flat. No glass. Legibility dies under backdrop-filter.
- **AI side panels, command palette, modals:** frosted glass. Use `.teacher-ai-surface` or `.teacher-elevated-surface`.
- **Companion (spatial HUD):** NO glass. Luminous strokes on transparent. The AR compositor smears backdrop-filter. That's why companion-side stylesheets will be a separate build.

## Audit items flagged by the spec but not yet addressed

1. **Activity bar replacement** — §1 Priority #1. Biggest single structural change; requires `ApplicationShell` + `SidePanelHandler` DI rebind.
2. **Status bar rebuild** — §1 Priority #5. Strip git/encoding/LF confetti; leave Pulse + one breadcrumb.
3. **Product icon theme** — §1 Priority #2. Replace Codicons globally. ~25 custom hero icons (AI Agent, Pulse, Companion, Handoff, etc.) still unbuilt.
4. **Command palette re-theme** — §1 Priority #6. Apply `.teacher-elevated-surface` to `QuickInputWidget`; add TE-numbered action categories.
5. **Settings UI** — §1 Priority #9. Full replacement to match DNA; progressive disclosure + Ableton-style brightness sliders.

Those stay open. The primitives shipped here (palette, motion, typography, Pulse) make the other work legible when it lands — everything that slots in after this will automatically inherit the DNA.
