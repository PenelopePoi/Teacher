// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * US National Provider Identifier (NPI) — 10-digit identifier with a Luhn
 * checksum over the NPI's own digits prefixed with `80840`.
 *
 * Requires a `NPI` label to avoid false positives on any 10-digit number.
 */
const NPI_RE = /\bNPI\s*[:#=]?\s*(\d{10})\b/gi;

function passesLuhn(digits: string): boolean {
    // NPI Luhn is computed over "80840" + the 9-digit base; the 10th digit
    // is the check digit. When COMPUTING the check digit (as opposed to
    // VALIDATING a full number including the check digit), we double every
    // other digit starting from the RIGHTMOST of the base — hence
    // `alternate = true` initially.
    const full = '80840' + digits.slice(0, 9);
    let sum = 0;
    let alternate = true;
    for (let i = full.length - 1; i >= 0; i--) {
        let n = Number(full[i]);
        if (alternate) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alternate = !alternate;
    }
    const check = (10 - (sum % 10)) % 10;
    return check === Number(digits[9]);
}

export const npiDetector: Detector = {
    className: 'npi',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        let match: RegExpExecArray | null;
        NPI_RE.lastIndex = 0;
        while ((match = NPI_RE.exec(content)) !== null) {
            if (!passesLuhn(match[1])) continue;
            detections.push({
                className: 'npi',
                start: match.index,
                end: match.index + match[0].length,
                placeholder: '[REDACTED:NPI]'
            });
        }
        return detections;
    }
};
