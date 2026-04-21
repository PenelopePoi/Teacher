// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { ContentTypeHandler, DetectionClass, Detector, DetectorContext, RedactionResult } from '../types';
import { redact } from '../redactor';

const JSON_EXTENSIONS = new Set(['.json']);

function extensionOf(path: string): string {
    const dot = path.lastIndexOf('.');
    return dot >= 0 ? path.slice(dot).toLowerCase() : '';
}

const ALL_CLASSES: readonly DetectionClass[] = [
    'ssn', 'email', 'phone', 'dob', 'mrn', 'nhs-number', 'npi',
    'name', 'address', 'geo-coord', 'genomic-id', 'file-path',
    'ipv4', 'credit-card'
];

/**
 * Recursively scrub string values within a JSON structure, preserving shape.
 * Keys are NOT scrubbed — if keys contain PII your structure is already
 * compromised, and redacting keys breaks downstream tooling.
 */
function scrubValue(
    value: unknown,
    detectors: readonly Detector[],
    context: DetectorContext,
    counts: Record<DetectionClass, number>
): unknown {
    if (typeof value === 'string') {
        const result = redact(value, detectors, context);
        for (const k of ALL_CLASSES) counts[k] += result.counts[k];
        return result.content;
    }
    if (Array.isArray(value)) {
        return value.map(v => scrubValue(v, detectors, context, counts));
    }
    if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = scrubValue(v, detectors, context, counts);
        }
        return out;
    }
    return value;
}

export const jsonHandler: ContentTypeHandler = {
    contentType: 'application/json',
    matches(filePath: string, firstBytes: Buffer): boolean {
        if (JSON_EXTENSIONS.has(extensionOf(filePath))) return true;
        const start = firstBytes.toString('utf8', 0, Math.min(firstBytes.length, 8)).trimStart();
        return start.startsWith('{') || start.startsWith('[');
    },
    scrub(input: Buffer, detectors: readonly Detector[], context: DetectorContext): RedactionResult {
        const text = input.toString('utf8');
        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch {
            // Malformed JSON — fall through to plain-text scrubbing.
            return redact(text, detectors, context);
        }
        const counts = Object.create(null) as Record<DetectionClass, number>;
        for (const c of ALL_CLASSES) counts[c] = 0;
        const scrubbed = scrubValue(parsed, detectors, context, counts);
        return {
            content: JSON.stringify(scrubbed, undefined, 2),
            detections: [],
            counts
        };
    }
};
