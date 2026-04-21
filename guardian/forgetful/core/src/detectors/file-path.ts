// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * File-path personalization detector.
 *
 * Redacts paths containing a personal home-directory segment, keeping the
 * path shape but replacing the user component. These are pervasive in
 * Jupyter notebook outputs, stack traces, and config dumps.
 *
 * Matches:
 *   /Users/alice/Documents/...   (macOS)
 *   /home/alice/Documents/...    (Linux)
 *   C:\Users\alice\Documents\... (Windows)
 */
const POSIX_RE = /(?:\/Users\/|\/home\/)([A-Za-z][A-Za-z0-9_.-]{0,31})/g;
const WINDOWS_RE = /([A-Za-z]:\\Users\\)([A-Za-z][A-Za-z0-9_.-]{0,31})/g;

export const filePathDetector: Detector = {
    className: 'file-path',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        let match: RegExpExecArray | null;

        POSIX_RE.lastIndex = 0;
        while ((match = POSIX_RE.exec(content)) !== null) {
            // Start of the matched prefix + the username portion
            const userStart = match.index + match[0].length - match[1].length;
            const userEnd = userStart + match[1].length;
            detections.push({
                className: 'file-path',
                start: userStart,
                end: userEnd,
                placeholder: 'anon-user'
            });
        }

        WINDOWS_RE.lastIndex = 0;
        while ((match = WINDOWS_RE.exec(content)) !== null) {
            const userStart = match.index + match[1].length;
            const userEnd = userStart + match[2].length;
            detections.push({
                className: 'file-path',
                start: userStart,
                end: userEnd,
                placeholder: 'anon-user'
            });
        }

        return detections;
    }
};
