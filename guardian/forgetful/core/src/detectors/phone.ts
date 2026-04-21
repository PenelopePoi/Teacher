// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * Phone-number detector covering common US / international forms.
 *
 * Matches:
 *   - `(555) 123-4567`, `555-123-4567`, `555.123.4567`, `555 123 4567`
 *   - `+1 555 123 4567`, `+44 20 7123 4567`
 *
 * Requires a leading word boundary and at least one separator to avoid
 * catching arbitrary 10-digit numbers (which are often IDs, not phones).
 */
const PHONE_RE = /(?<!\d)(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?|\d{2,4}[\s.-])\d{2,4}[\s.-]\d{2,4}(?!\d)/g;

export const phoneDetector: Detector = {
    className: 'phone',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        let match: RegExpExecArray | null;
        PHONE_RE.lastIndex = 0;
        while ((match = PHONE_RE.exec(content)) !== null) {
            // Heuristic filter: require at least 7 digits total.
            const digitCount = (match[0].match(/\d/g) ?? []).length;
            if (digitCount < 7 || digitCount > 15) {
                continue;
            }
            detections.push({
                className: 'phone',
                start: match.index,
                end: match.index + match[0].length,
                placeholder: '[REDACTED:PHONE]'
            });
        }
        return detections;
    }
};
