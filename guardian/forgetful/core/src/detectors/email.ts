// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * RFC-5322-ish email detector. Intentionally permissive: we prefer false
 * positives (redacting something that looks email-like) to false negatives.
 *
 * Excludes obvious non-email artifacts like `.git` path fragments and
 * template placeholders (`{user}@example.com` when wrapped in braces).
 */
const EMAIL_RE = /(?<![{\w-])[A-Za-z0-9][A-Za-z0-9._%+-]{0,63}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+\b/g;

export const emailDetector: Detector = {
    className: 'email',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        let match: RegExpExecArray | null;
        EMAIL_RE.lastIndex = 0;
        while ((match = EMAIL_RE.exec(content)) !== null) {
            detections.push({
                className: 'email',
                start: match.index,
                end: match.index + match[0].length,
                placeholder: '[REDACTED:EMAIL]'
            });
        }
        return detections;
    }
};
