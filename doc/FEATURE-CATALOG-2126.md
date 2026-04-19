# Teacher 2126 — Feature Catalog

*IDE scope only. Workshop + Companion. Reality-anchored.*

## Status Key: 2026 Implementation

- **SHIPPED** = implemented in current codebase
- **SEEDED** = foundation exists, needs enhancement
- **PLANNED** = not yet built, spec exists
- **2126** = future vision, no 2026 implementation expected

## Section O: The 15 Invariants (all SHIPPED)

1. The 2.4-second breathing glow — `teacher-shell.css @keyframes teacher-breathing-glow`
2. Amber attention color #E8A948 — `dark_teacher.json`, `teacher-shell.css`
3. Mint thinking color #7CE0C9 — `pulse-panel-widget.tsx`
4. The Pulse as single universal indicator — `pulse-panel-widget.tsx`
5. One question when intent unclear — Tutor agent system prompt
6. Geist + Geist Mono typography — `teacher-identity.css`, preferences
7. TE-style numbered labels — `.teacher-te-label` class
8. Before/after canvas as review surface — **SHIPPED** (before-after-widget.tsx)
9. Teachable Moments as pedagogy primitive — **SHIPPED** (50+ concepts, detector, library)
10. Zero-chrome canvas with hover affordances — **SHIPPED** (focus mode + CSS)
11. Sidebar-first chrome — **SHIPPED** (teacher-menu-bar.ts hides menu)
12. Cmd+K command palette — **SHIPPED** (wordmark opens it, glass material)
13. Two-surface confirmation — SEEDED (deploy gesture in spec)
14. CRDT intent-object continuity — **SHIPPED** (intent-protocol.ts, intent-dock-widget.tsx)
15. No spinners, ever — SHIPPED (breathing glow replaces all)

## Mapping: 2026 Components → 2126 Features

| 2126 Feature | 2026 Component | Status |
|---|---|---|
| A1. Pulse states | pulse-panel-widget.tsx | **SHIPPED** |
| A4. One-question rule | tutor-agent.ts prompt | **SHIPPED** |
| A5. Intent Drop | intent-dock-widget.tsx, intent-protocol.ts | **SHIPPED** |
| A6. Pinned Thought | pinned-thought-gutter.ts | **SHIPPED** |
| B1. Surface instantiation | browser app | **SHIPPED** |
| B4. Sidebar-first rail | teacher-side-panel-handler.ts | **SHIPPED** |
| B5. Floating toolbar | — | PLANNED |
| B6. Command palette | teacher-quick-input.ts (glass) | **SHIPPED** |
| B7. Help overlay | — | PLANNED |
| B10. Typography | teacher-identity.css | **SHIPPED** |
| B11. Color semantics | teacher-shell.css + dark_teacher.json | **SHIPPED** |
| B12. Breathing glow | teacher-shell.css | **SHIPPED** |
| C1. Pulse Panel | pulse-panel-widget.tsx | **SHIPPED** |
| C2. Coalition dispatch | asi-bridge-service.ts (retry, timeout) | SEEDED |
| C3. Coalition trace | agent-session-manager.ts | SEEDED |
| C5. Plan Mode | lesson commands + agent-session-manager | SEEDED |
| C6. Before/after canvas | before-after-widget.tsx | **SHIPPED** |
| C7. Ghost Timeline | ghost-timeline-widget.tsx, timeline-service.ts | **SHIPPED** |
| C8. Drag-to-Ask | — | PLANNED |
| C9. Teachable Moments | teachable-moment-widget.tsx, concept-library.ts (50+ concepts) | **SHIPPED** |
| C10. Pedagogy library | pedagogy-library-widget.tsx | **SHIPPED** |
| C15. Agent queue | — | PLANNED |
| C16. Mode cycle (4 modes) | mode-cycle-command.ts | **SHIPPED** |
| C17. Reversible/irreversible | destructive-op-guard.ts | **BUILDING** |
| C18. Checkpoint/rewind | agent-session-manager.ts | SEEDED |
| D1. Per-hunk approval | — | PLANNED |
| D4. Spend limits (auto-cap) | auto-cap-middleware.ts | **BUILDING** |
| H1-H7. Learning features | curriculum (3 courses, 15 lessons) | **SHIPPED** |
| N7. No spinners | teacher-shell.css | **SHIPPED** |

### Summary: 20 SHIPPED, 5 SEEDED, 2 BUILDING, 5 PLANNED
