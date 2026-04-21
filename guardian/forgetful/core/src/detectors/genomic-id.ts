// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * Genomic-identifier detector.
 *
 * Catches common patterns from dbGaP, TCGA, 1000 Genomes, GTEx, and generic
 * "Sample ID" labels. These identifiers can be re-linked to subject records
 * in controlled-access datasets, so we treat them as PII-equivalent.
 *
 * Patterns:
 *   - dbGaP: phs\d{6} or phs\d{6}\.v\d+\.p\d+
 *   - TCGA barcode: TCGA-[A-Z0-9]{2}-[A-Z0-9]{4}(-[A-Z0-9]+)*
 *   - 1000 Genomes: NA\d{5} or HG\d{5}
 *   - GTEx: GTEX-[A-Z0-9]+
 *   - Labeled: "Sample ID: FOO-123", "Subject ID: ..."
 */
const PATTERNS: readonly RegExp[] = [
    /\bphs\d{6}(?:\.v\d+(?:\.p\d+)?)?\b/g,
    /\bTCGA-[A-Z0-9]{2}-[A-Z0-9]{4}(?:-[A-Z0-9]+)*\b/g,
    /\b(?:NA|HG)\d{5}\b/g,
    /\bGTEX-[A-Z0-9]+\b/g,
    /\b(?:Sample|Subject|Donor)\s+(?:ID|Identifier)\s*[:#=]\s*([A-Za-z0-9][A-Za-z0-9_-]{2,31})\b/gi
];

export const genomicIdDetector: Detector = {
    className: 'genomic-id',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        for (const pattern of PATTERNS) {
            pattern.lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = pattern.exec(content)) !== null) {
                detections.push({
                    className: 'genomic-id',
                    start: match.index,
                    end: match.index + match[0].length,
                    placeholder: '[REDACTED:GENOMIC-ID]'
                });
            }
        }
        return detections;
    }
};
