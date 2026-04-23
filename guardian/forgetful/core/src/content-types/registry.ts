// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { ContentTypeHandler } from '../types';
import { csvHandler } from './csv';
import { dicomHandler } from './dicom';
import { imageExifHandler } from './image-exif';
import { jsonHandler } from './json';
import { markdownHandler } from './markdown';
import { notebookHandler } from './notebook';
import { textHandler } from './text';

/**
 * Default content-type handler chain, in priority order. The first matching
 * handler wins. Place more-specific handlers before more-general ones.
 */
export function defaultHandlers(): readonly ContentTypeHandler[] {
    return [
        // Specific formats first
        dicomHandler,
        notebookHandler,
        jsonHandler,
        csvHandler,
        markdownHandler,
        imageExifHandler,
        // Generic text fallback last
        textHandler
    ];
}
