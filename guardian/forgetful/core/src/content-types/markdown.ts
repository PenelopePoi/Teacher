// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { ContentTypeHandler, Detector, DetectorContext, RedactionResult } from '../types';
import { redact } from '../redactor';

const MD_EXTENSIONS = new Set(['.md', '.markdown', '.mdx']);

function extensionOf(path: string): string {
    const dot = path.lastIndexOf('.');
    return dot >= 0 ? path.slice(dot).toLowerCase() : '';
}

export const markdownHandler: ContentTypeHandler = {
    contentType: 'text/markdown',
    matches(filePath: string, _firstBytes: Buffer): boolean {
        return MD_EXTENSIONS.has(extensionOf(filePath));
    },
    scrub(input: Buffer, detectors: readonly Detector[], context: DetectorContext): RedactionResult {
        // Markdown is whole-buffer-scrubbed; we don't attempt to preserve
        // block-level structure beyond what the redactor already preserves
        // (newlines are untouched because placeholders don't contain them).
        const content = input.toString('utf8');
        return redact(content, detectors, context);
    }
};
