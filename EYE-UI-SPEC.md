# Eye UI v2 — Teacher IDE Design Specification

See the full spec in the user's message that produced this file.
Direction: Glassmorphic Industrial — warm charcoal + amber + Geist
Signature: 2.4s breathing glow, amber #E8A948, no spinners ever

## Implementation Status

### Phase 1 — Identity
- [x] Custom theme (dark_teacher.json) — v2 palette (warm charcoal + amber)
- [x] Geist + Geist Mono fonts downloaded and embedded
- [x] Glass CSS overrides (AI surfaces only, flat chrome elsewhere)
- [x] Favicon (Teacher mark SVG)
- [x] Theme registered and set as default
- [x] Font injection via @font-face + --theia-ui-font-family
- [ ] Product icon theme (Lucide base + 25 custom)

### Phase 2 — AI Surface
- [x] Pulse Panel (ambient AI status strip)
- [x] Ghost Timeline (Ableton-style AI undo ribbon)
- [x] Teachable Moments (gold underline on new concepts)
- [ ] Ghost text with explanation tooltip

### Phase 3 — Beginner UX  
- [ ] Complexity levels (Beginner/Intermediate/Advanced)
- [ ] Compassionate error messages
- [ ] Drag-to-Ask orb
- [ ] Before/After Canvas

### Phase 4 — Structural (DI Rebinds)
- [ ] Activity bar → sidebar-first rail (SidePanelHandler rebind)
- [ ] Status bar → ambient strip (StatusBar rebind)
- [ ] Tab bar → capsule renderer (TabBarRenderer rebind)
- [ ] Command palette → glass TE-style (QuickInputWidget override)
- [ ] Menu bar → hidden on web (MenuBarWidget rebind)

### Phase 5 — Companion
- [ ] Voice intent drop protocol
- [ ] CRDT sync (Yjs + intent objects)
- [ ] Glance Pulse HUD
- [ ] Breathing glow rendering (WebGL/Canvas)
