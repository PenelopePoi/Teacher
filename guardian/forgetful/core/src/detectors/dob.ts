// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * Date-of-birth-style detector. Matches dates in common forms, but ONLY when
 * contextually framed as a DOB (adjacent label like "DOB", "Date of Birth",
 * "Born", "D.O.B.").
 *
 * Bare dates are NOT redacted — they are common in technical content
 * (release dates, changelogs). DOB is a subset of dates; we err on the side
 * of needing a label.
 */
const DOB_RE = /\b(?:DOB|D\.?O\.?B\.?|Date\s*of\s*Birth|Born(?:\s*on)?)\s*[:=-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}-\d{2}-\d{2}|[A-Za-z]{3,9}\s+\d{1,2},?\s*\d{4})/gi;

export const dobDetector: Detector = {
    className: 'dob',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        let match: RegExpExecArray | null;
        DOB_RE.lastIndex = 0;
        while ((match = DOB_RE.exec(content)) !== null) {
            // Redact the entire labeled span (label + date). Safer than
            // leaving the label dangling next to a placeholder.
            detections.push({
                className: 'dob',
                start: match.index,
                end: match.index + match[0].length,
                placeholder: '[REDACTED:DOB]'
            });
        }
        return detections;
    }
};
