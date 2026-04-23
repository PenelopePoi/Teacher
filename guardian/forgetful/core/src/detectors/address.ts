// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * US-style street address detector.
 *
 * Matches `<digits> <words> <street-type>` where street-type is from a
 * canonical list. Intentionally narrow — zip codes alone are NOT redacted
 * because they are commonly used as region identifiers.
 *
 * International addresses are NOT reliably caught by this detector and
 * should be handled by NER (see `name-ner.ts`) or human review.
 */
const STREET_TYPES = [
    'Street', 'St', 'Avenue', 'Ave', 'Road', 'Rd', 'Boulevard', 'Blvd',
    'Lane', 'Ln', 'Drive', 'Dr', 'Court', 'Ct', 'Place', 'Pl',
    'Terrace', 'Ter', 'Way', 'Circle', 'Cir', 'Highway', 'Hwy',
    'Parkway', 'Pkwy', 'Square', 'Sq', 'Trail', 'Trl'
];
const ADDRESS_RE = new RegExp(
    `\\b\\d{1,6}\\s+(?:[A-Z][A-Za-z0-9.'-]*\\s+){1,5}(?:${STREET_TYPES.join('|')})\\b\\.?`,
    'g'
);

export const addressDetector: Detector = {
    className: 'address',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        let match: RegExpExecArray | null;
        ADDRESS_RE.lastIndex = 0;
        while ((match = ADDRESS_RE.exec(content)) !== null) {
            detections.push({
                className: 'address',
                start: match.index,
                end: match.index + match[0].length,
                placeholder: '[REDACTED:ADDRESS]'
            });
        }
        return detections;
    }
};
