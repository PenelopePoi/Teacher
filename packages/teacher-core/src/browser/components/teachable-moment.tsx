import * as React from '@theia/core/shared/react';

const STORAGE_KEY = 'teacher.teachable.seen.v1';

function readSeen(): Set<string> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) { return new Set(); }
        return new Set<string>(JSON.parse(raw));
    } catch {
        return new Set();
    }
}

function writeSeen(seen: Set<string>): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
    } catch {
        /* storage may be disabled */
    }
}

function key(term: string): string {
    return term.trim().toLowerCase();
}

/**
 * Returns true if this is the first time the user has seen `term`.
 * Also marks it as seen so future renders return false.
 */
export function useFirstSight(term: string): boolean {
    const k = key(term);
    const [firstSight] = React.useState(() => {
        const seen = readSeen();
        if (seen.has(k)) {
            return false;
        }
        seen.add(k);
        writeSeen(seen);
        return true;
    });
    return firstSight;
}

export interface TeachableMomentProps {
    readonly term: string;
    readonly explanation: React.ReactNode;
    readonly children?: React.ReactNode;
}

/**
 * §2 item #6 — Teachable Moments.
 *
 * Wrap any identifier the learner may not have seen before.
 *   <TeachableMoment term="async/await" explanation="…">async</TeachableMoment>
 *
 * On first render, the child text is gold-underlined (spec palette,
 * --teacher-accent-yellow) and a hover card reveals the explanation.
 * The user clicks "Got it" to mark the concept known — subsequent
 * renders in any widget render the children normally.
 *
 * Persistence is localStorage (per-user, per-browser-profile). No
 * backend required.
 */
export function TeachableMoment({ term, explanation, children }: TeachableMomentProps): React.ReactElement {
    const [firstSight, setFirstSight] = React.useState(() => useFirstSightInitial(term));
    const [open, setOpen] = React.useState(false);
    const label = children ?? term;

    const dismiss = React.useCallback((): void => {
        setFirstSight(false);
        setOpen(false);
    }, []);

    if (!firstSight) {
        return <span>{label}</span>;
    }

    return (
        <span
            className={`teacher-teachable ${open ? 'teacher-teachable--open' : ''}`}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            tabIndex={0}
            aria-describedby={`teachable-${sanitize(term)}`}
        >
            <span className="teacher-teachable-anchor">{label}</span>
            {open && (
                <span
                    id={`teachable-${sanitize(term)}`}
                    className="teacher-teachable-card"
                    role="tooltip"
                    onMouseEnter={e => e.stopPropagation()}
                >
                    <span className="teacher-teachable-term">{term}</span>
                    <span className="teacher-teachable-body">{explanation}</span>
                    <button type="button" className="teacher-teachable-dismiss" onClick={dismiss}>
                        Got it
                    </button>
                </span>
            )}
        </span>
    );
}

/**
 * Non-hook initializer — checks and writes seen state without the
 * React lifecycle side effects of useFirstSight. Used by the component
 * above so it can control its own "got it" state.
 */
function useFirstSightInitial(term: string): boolean {
    const k = key(term);
    const seen = readSeen();
    if (seen.has(k)) {
        return false;
    }
    return true;
}

function sanitize(t: string): string {
    return t.replace(/[^a-z0-9-]/gi, '_').toLowerCase();
}
