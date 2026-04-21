// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { ContentTypeHandler, DetectionClass, Detector, DetectorContext, RedactionResult } from '../types';
import { redact } from '../redactor';

const CSV_EXTENSIONS = new Set(['.csv', '.tsv']);

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
 * CSV handler: scrubs each row line-wise so column boundaries (delimiters)
 * are preserved. This is NOT a fully-parsing CSV reader — quoted fields
 * containing newlines are treated as multi-line text, which is fine for
 * scrubbing because the detectors don't care about column boundaries.
 *
 * Header row is scrubbed like any other row — a header containing the word
 * "SSN" is not redacted (it's a label), but a header cell that happens to
 * match `[0-9]{3}-[0-9]{2}-[0-9]{4}` will be.
 */
export const csvHandler: ContentTypeHandler = {
    contentType: 'text/csv',
    matches(filePath: string, _firstBytes: Buffer): boolean {
        return CSV_EXTENSIONS.has(extensionOf(filePath));
    },
    scrub(input: Buffer, detectors: readonly Detector[], context: DetectorContext): RedactionResult {
        const text = input.toString('utf8');
        const lines = text.split(/\r?\n/);
        const counts = Object.create(null) as Record<DetectionClass, number>;
        for (const c of ALL_CLASSES) counts[c] = 0;
        const outLines: string[] = [];
        for (const line of lines) {
            if (line.length === 0) {
                outLines.push('');
                continue;
            }
            const result = redact(line, detectors, context);
            outLines.push(result.content);
            for (const k of ALL_CLASSES) counts[k] += result.counts[k];
        }
        return {
            content: outLines.join('\n'),
            detections: [],
            counts
        };
    }
};
