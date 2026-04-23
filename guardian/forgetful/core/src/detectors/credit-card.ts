// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * Credit-card detector. Matches 13-19 digit runs (optionally dash/space
 * separated), validates with Luhn.
 */
const CC_RE = /\b(?:\d[ -]?){13,19}\b/g;

function passesLuhn(digits: string): boolean {
    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = Number(digits[i]);
        if (Number.isNaN(n)) return false;
        if (alternate) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alternate = !alternate;
    }
    return sum % 10 === 0;
}

export const creditCardDetector: Detector = {
    className: 'credit-card',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        let match: RegExpExecArray | null;
        CC_RE.lastIndex = 0;
        while ((match = CC_RE.exec(content)) !== null) {
            const digits = match[0].replace(/[ -]/g, '');
            if (digits.length < 13 || digits.length > 19) continue;
            if (!passesLuhn(digits)) continue;
            detections.push({
                className: 'credit-card',
                start: match.index,
                end: match.index + match[0].length,
                placeholder: '[REDACTED:CREDIT-CARD]'
            });
        }
        return detections;
    }
};
