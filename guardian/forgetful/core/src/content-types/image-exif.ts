// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { ContentTypeHandler, DetectionClass, Detector, DetectorContext, RedactionResult } from '../types';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.tif', '.tiff']);

function extensionOf(path: string): string {
    const dot = path.lastIndexOf('.');
    return dot >= 0 ? path.slice(dot).toLowerCase() : '';
}

const ALL_CLASSES: readonly DetectionClass[] = [
    'ssn', 'email', 'phone', 'dob', 'mrn', 'nhs-number', 'npi',
    'name', 'address', 'geo-coord', 'genomic-id', 'file-path',
    'ipv4', 'credit-card'
];

function zeroCounts(): Record<DetectionClass, number> {
    const out = Object.create(null) as Record<DetectionClass, number>;
    for (const c of ALL_CLASSES) out[c] = 0;
    return out;
}

/**
 * Strip EXIF from a JPEG by walking APP1/APP2 segments. We preserve the
 * JPEG SOI marker and all non-APP segments. This is a minimal in-buffer
 * strip — not a full re-encoder.
 *
 * JPEG structure: 0xFF 0xD8 (SOI), then a sequence of markers. APP1 = 0xFFE1,
 * APP2 = 0xFFE2, ... APPn markers carry EXIF, XMP, ICC, etc. We drop all
 * APP markers; this removes EXIF (GPS, device, timestamp) and XMP (which
 * may contain creator tools with usernames).
 */
function stripJpegExif(buf: Buffer): { out: Buffer; stripped: boolean } {
    if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) {
        return { out: buf, stripped: false };
    }
    const outParts: Buffer[] = [buf.subarray(0, 2)];
    let i = 2;
    let stripped = false;
    while (i < buf.length - 1) {
        if (buf[i] !== 0xff) break;
        const marker = buf[i + 1];
        // Start of Scan (0xDA) — rest of file is entropy-coded image data.
        if (marker === 0xda) {
            outParts.push(buf.subarray(i));
            return { out: Buffer.concat(outParts), stripped };
        }
        // End of Image (0xD9).
        if (marker === 0xd9) {
            outParts.push(buf.subarray(i, i + 2));
            return { out: Buffer.concat(outParts), stripped };
        }
        // Fill bytes 0xFF 0xFF ...
        if (marker === 0xff) {
            i += 1;
            continue;
        }
        // Standalone markers (no length payload): 0x01, 0xD0..0xD7.
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
            outParts.push(buf.subarray(i, i + 2));
            i += 2;
            continue;
        }
        if (i + 3 >= buf.length) break;
        const segLen = buf.readUInt16BE(i + 2);
        const segEnd = i + 2 + segLen;
        if (segEnd > buf.length) break;
        const isApp = marker >= 0xe0 && marker <= 0xef;
        const isCom = marker === 0xfe;
        if (isApp || isCom) {
            stripped = true;
        } else {
            outParts.push(buf.subarray(i, segEnd));
        }
        i = segEnd;
    }
    return { out: Buffer.concat(outParts), stripped };
}

export const imageExifHandler: ContentTypeHandler = {
    contentType: 'image/jpeg',
    matches(filePath: string, firstBytes: Buffer): boolean {
        if (IMAGE_EXTENSIONS.has(extensionOf(filePath))) return true;
        return firstBytes.length >= 2 && firstBytes[0] === 0xff && firstBytes[1] === 0xd8;
    },
    scrub(input: Buffer, _detectors: readonly Detector[], _context: DetectorContext): RedactionResult {
        // JPEG only in v1. PNG/TIFF EXIF stripping is a follow-up.
        const { out, stripped } = stripJpegExif(input);
        const counts = zeroCounts();
        if (stripped) {
            // Treat EXIF/APP strips as a geo-coord-equivalent for manifest
            // accounting. The exact category matters less than the fact
            // that *something* was removed; a separate audit can refine.
            counts['geo-coord'] = 1;
        }
        return {
            content: out.toString('binary'),
            detections: [],
            counts
        };
    }
};
