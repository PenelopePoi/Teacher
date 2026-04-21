// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { DetectionClass, Detector, DetectorContext, RedactionResult } from './types';

const ALL_CLASSES: readonly DetectionClass[] = [
    'ssn', 'email', 'phone', 'dob', 'mrn', 'nhs-number', 'npi',
    'name', 'address', 'geo-coord', 'genomic-id', 'file-path',
    'ipv4', 'credit-card'
];

function zeroCounts(): Record<DetectionClass, number> {
    const counts = Object.create(null) as Record<DetectionClass, number>;
    for (const c of ALL_CLASSES) {
        counts[c] = 0;
    }
    return counts;
}

/**
 * Apply all detectors to `content`, merge overlapping detections, and
 * produce a redacted string plus counts.
 *
 * Overlap policy: when two detectors both hit the same region, the LONGER
 * match wins. Ties break deterministically by class-name order in
 * `ALL_CLASSES`. This avoids double-redaction and keeps output stable.
 */
export function redact(
    content: string,
    detectors: readonly Detector[],
    context: DetectorContext
): RedactionResult {
    const all = detectors.flatMap(d => d.detect(content, context));
    if (all.length === 0) {
        return {
            content,
            detections: [],
            counts: zeroCounts()
        };
    }

    // Sort by start asc, then length desc (longer match preferred), then
    // stable class-name order.
    const sorted = [...all].sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        const lenA = a.end - a.start;
        const lenB = b.end - b.start;
        if (lenA !== lenB) return lenB - lenA;
        return ALL_CLASSES.indexOf(a.className) - ALL_CLASSES.indexOf(b.className);
    });

    // Resolve overlaps: walk in order, skip any detection starting inside
    // the previously-accepted one.
    const accepted: typeof sorted = [];
    let lastEnd = -1;
    for (const det of sorted) {
        if (det.start < lastEnd) continue;
        accepted.push(det);
        lastEnd = det.end;
    }

    // Build output.
    const counts = zeroCounts();
    let output = '';
    let cursor = 0;
    for (const det of accepted) {
        if (det.start > cursor) {
            output += content.slice(cursor, det.start);
        }
        output += det.placeholder;
        counts[det.className] += 1;
        cursor = det.end;
    }
    if (cursor < content.length) {
        output += content.slice(cursor);
    }

    return {
        content: output,
        detections: accepted,
        counts
    };
}
