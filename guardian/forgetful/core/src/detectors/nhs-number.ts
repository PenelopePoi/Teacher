// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * UK NHS Number detector.
 *
 * NHS numbers are 10 digits, commonly formatted as `NNN NNN NNNN` or
 * `NNN-NNN-NNNN`, with a Modulus 11 check on the last digit. We validate
 * the checksum to keep false positives low.
 */
const NHS_RE = /\b(\d{3})[\s-]?(\d{3})[\s-]?(\d{4})\b/g;

function passesChecksum(digits: string): boolean {
    if (digits.length !== 10) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += Number(digits[i]) * (10 - i);
    }
    const remainder = sum % 11;
    const check = remainder === 0 ? 0 : 11 - remainder;
    // Check digit of 10 means invalid NHS number.
    if (check === 10) return false;
    return check === Number(digits[9]);
}

export const nhsNumberDetector: Detector = {
    className: 'nhs-number',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        let match: RegExpExecArray | null;
        NHS_RE.lastIndex = 0;
        while ((match = NHS_RE.exec(content)) !== null) {
            const digits = match[1] + match[2] + match[3];
            if (!passesChecksum(digits)) continue;
            detections.push({
                className: 'nhs-number',
                start: match.index,
                end: match.index + match[0].length,
                placeholder: '[REDACTED:NHS-NUMBER]'
            });
        }
        return detections;
    }
};
