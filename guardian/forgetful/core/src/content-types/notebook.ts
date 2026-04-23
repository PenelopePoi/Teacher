// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { ContentTypeHandler, DetectionClass, Detector, DetectorContext, RedactionResult } from '../types';
import { redact } from '../redactor';

const IPYNB_EXTENSIONS = new Set(['.ipynb']);

function extensionOf(path: string): string {
    const dot = path.lastIndexOf('.');
    return dot >= 0 ? path.slice(dot).toLowerCase() : '';
}

const ALL_CLASSES: readonly DetectionClass[] = [
    'ssn', 'email', 'phone', 'dob', 'mrn', 'nhs-number', 'npi',
    'name', 'address', 'geo-coord', 'genomic-id', 'file-path',
    'ipv4', 'credit-card'
];

interface NotebookCell {
    cell_type: string;
    source: string | string[];
    outputs?: Array<Record<string, unknown>>;
    metadata?: Record<string, unknown>;
}

interface Notebook {
    cells: NotebookCell[];
    metadata?: Record<string, unknown>;
    [other: string]: unknown;
}

function scrubStringArray(
    source: string | string[],
    detectors: readonly Detector[],
    context: DetectorContext,
    counts: Record<DetectionClass, number>
): string | string[] {
    if (typeof source === 'string') {
        const result = redact(source, detectors, context);
        for (const k of ALL_CLASSES) counts[k] += result.counts[k];
        return result.content;
    }
    return source.map(s => {
        const result = redact(s, detectors, context);
        for (const k of ALL_CLASSES) counts[k] += result.counts[k];
        return result.content;
    });
}

/**
 * Jupyter `.ipynb` handler.
 *
 * Notebooks carry three PII-prone surfaces:
 *   1. `cell.source` — user-authored code and markdown.
 *   2. `cell.outputs[].text` / `cell.outputs[].data['text/plain']` — stdout,
 *      stderr, repr output, which frequently contains file paths, dataframe
 *      dumps with patient names, etc.
 *   3. `cell.metadata` and top-level `metadata` — execution environment
 *      info, sometimes includes usernames.
 *
 * We scrub 1 and 2 with the standard detector suite. For 3 we strip the
 * entire `metadata` block at the notebook level (replace with `{}`) because
 * notebook metadata is not meaningful for redistribution and may carry
 * kernel paths and user info.
 */
export const notebookHandler: ContentTypeHandler = {
    contentType: 'application/x-ipynb+json',
    matches(filePath: string, _firstBytes: Buffer): boolean {
        return IPYNB_EXTENSIONS.has(extensionOf(filePath));
    },
    scrub(input: Buffer, detectors: readonly Detector[], context: DetectorContext): RedactionResult {
        const text = input.toString('utf8');
        let parsed: Notebook;
        try {
            parsed = JSON.parse(text) as Notebook;
        } catch {
            return redact(text, detectors, context);
        }
        const counts = Object.create(null) as Record<DetectionClass, number>;
        for (const c of ALL_CLASSES) counts[c] = 0;

        for (const cell of parsed.cells ?? []) {
            cell.source = scrubStringArray(cell.source, detectors, context, counts);
            if (Array.isArray(cell.outputs)) {
                for (const out of cell.outputs) {
                    if (typeof out.text === 'string' || Array.isArray(out.text)) {
                        out.text = scrubStringArray(out.text as string | string[], detectors, context, counts);
                    }
                    const data = out.data as Record<string, unknown> | undefined;
                    if (data && typeof data === 'object') {
                        for (const [k, v] of Object.entries(data)) {
                            if (k.startsWith('text/') && (typeof v === 'string' || Array.isArray(v))) {
                                data[k] = scrubStringArray(v as string | string[], detectors, context, counts);
                            }
                        }
                    }
                }
            }
            // Cell metadata: strip outright — contains execution info.
            cell.metadata = {};
        }

        // Top-level metadata: strip.
        parsed.metadata = {};

        return {
            content: JSON.stringify(parsed, undefined, 1),
            detections: [],
            counts
        };
    }
};
