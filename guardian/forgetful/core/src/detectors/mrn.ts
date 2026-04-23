// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * Medical Record Number detector. MRNs have no national standard — they are
 * institution-specific. We require an explicit label to avoid false positives
 * on arbitrary numeric strings.
 *
 * Matches:
 *   MRN: 1234567
 *   MRN # 123-456
 *   Medical Record Number: ABC-123456
 *   Patient ID: 7890123
 */
const MRN_RE = /\b(?:MRN|Medical\s+Record\s+(?:Number|No\.?|#)|Patient\s+(?:ID|Identifier))\s*[:#=]?\s*([A-Za-z0-9][A-Za-z0-9-]{4,19})\b/gi;

export const mrnDetector: Detector = {
    className: 'mrn',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        let match: RegExpExecArray | null;
        MRN_RE.lastIndex = 0;
        while ((match = MRN_RE.exec(content)) !== null) {
            detections.push({
                className: 'mrn',
                start: match.index,
                end: match.index + match[0].length,
                placeholder: '[REDACTED:MRN]'
            });
        }
        return detections;
    }
};
