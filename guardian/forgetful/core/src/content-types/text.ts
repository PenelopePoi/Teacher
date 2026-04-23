// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { ContentTypeHandler, Detector, DetectorContext, RedactionResult } from '../types';
import { redact } from '../redactor';

const TEXT_EXTENSIONS = new Set([
    '.txt', '.log', '.rtf', '.text'
]);

function extensionOf(path: string): string {
    const dot = path.lastIndexOf('.');
    return dot >= 0 ? path.slice(dot).toLowerCase() : '';
}

function looksLikeText(firstBytes: Buffer): boolean {
    // UTF-8 BOM or ASCII-ish (heuristic: no null bytes in the first 512).
    if (firstBytes.length >= 3 && firstBytes[0] === 0xef && firstBytes[1] === 0xbb && firstBytes[2] === 0xbf) {
        return true;
    }
    const slice = firstBytes.subarray(0, Math.min(firstBytes.length, 512));
    for (const b of slice) {
        if (b === 0) return false;
    }
    return true;
}

export const textHandler: ContentTypeHandler = {
    contentType: 'text/plain',
    matches(filePath: string, firstBytes: Buffer): boolean {
        if (TEXT_EXTENSIONS.has(extensionOf(filePath))) return true;
        return looksLikeText(firstBytes);
    },
    scrub(input: Buffer, detectors: readonly Detector[], context: DetectorContext): RedactionResult {
        const content = input.toString('utf8');
        return redact(content, detectors, context);
    }
};
