// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * GPS-style geographic coordinate detector.
 *
 * Matches decimal-degree pairs with at least 4 digits of precision on both
 * axes — enough to localize a point to ~10 m, which is identifying. We skip
 * low-precision pairs (`37.5, -122.3`) because they commonly appear in
 * generic "San Francisco"-scale references.
 */
const COORD_RE = /(-?\d{1,3}\.\d{4,})\s*[,;]\s*(-?\d{1,3}\.\d{4,})/g;

export const geoCoordDetector: Detector = {
    className: 'geo-coord',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        let match: RegExpExecArray | null;
        COORD_RE.lastIndex = 0;
        while ((match = COORD_RE.exec(content)) !== null) {
            const lat = Number(match[1]);
            const lon = Number(match[2]);
            if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
            detections.push({
                className: 'geo-coord',
                start: match.index,
                end: match.index + match[0].length,
                placeholder: '[REDACTED:GEO]'
            });
        }
        return detections;
    }
};
