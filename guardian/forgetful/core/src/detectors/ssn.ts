// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * US Social Security Number detector.
 *
 * Matches `NNN-NN-NNNN` and `NNN NN NNNN` with word boundaries.
 * We deliberately reject the "no-separator" 9-digit form to avoid swallowing
 * random 9-digit numbers (timestamps, counters). False negatives on the
 * no-separator form are acceptable because human review catches them.
 *
 * Excludes known-invalid SSNs per SSA rules: area 000, 666, 900-999; group 00;
 * serial 0000.
 */
const SSN_RE = /\b(?!000|666|9\d{2})(\d{3})[-\s](?!00)(\d{2})[-\s](?!0000)(\d{4})\b/g;

export const ssnDetector: Detector = {
    className: 'ssn',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        let match: RegExpExecArray | null;
        SSN_RE.lastIndex = 0;
        while ((match = SSN_RE.exec(content)) !== null) {
            detections.push({
                className: 'ssn',
                start: match.index,
                end: match.index + match[0].length,
                placeholder: '[REDACTED:SSN]'
            });
        }
        return detections;
    }
};
