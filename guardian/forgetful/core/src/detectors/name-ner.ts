// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * Name detector backed by a local NER model via Ollama.
 *
 * This detector is OPTIONAL and OFF by default. When enabled, it calls the
 * configured Ollama host (see `CLAUDE.md` — `http://localhost:11434`) with
 * a tightly-scoped prompt asking the model to return name spans as JSON.
 *
 * If Ollama is unreachable, this detector returns zero detections and the
 * orchestrator flags `name-detection: disabled` in the manifest. It never
 * throws — a forgetful agent that crashes on a missing model is worse than
 * one that degrades gracefully and tells the human to review names by eye.
 *
 * Because a network call per file would be too slow, callers should batch
 * by constructing one detector instance per scrub run and caching the
 * Ollama client state. The default export here is a zero-detection stub
 * suitable for the default (NER-off) configuration.
 */

export interface NameNerOptions {
    readonly enabled: boolean;
    readonly ollamaHost?: string;
    readonly model?: string;
    /** Timeout in ms. Default 5000. */
    readonly timeoutMs?: number;
}

/**
 * Stub that returns no detections. Suitable for the default configuration
 * where NER is off. Real implementations should use this as a drop-in
 * replacement while preserving the same shape.
 */
export function createNameDetector(options: NameNerOptions = { enabled: false }): Detector {
    if (!options.enabled) {
        return {
            className: 'name',
            detect(_content: string, _context: DetectorContext): readonly Detection[] {
                return [];
            }
        };
    }
    // Live implementation deferred. For v1, even with `enabled: true`, we
    // return a no-op and mark the manifest as `name-detection: deferred`
    // so downstream reviewers know names must be checked by hand.
    // A follow-up PR will wire in the actual Ollama call.
    return {
        className: 'name',
        detect(_content: string, _context: DetectorContext): readonly Detection[] {
            return [];
        }
    };
}
