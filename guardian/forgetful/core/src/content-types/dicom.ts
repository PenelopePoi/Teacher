// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { ContentTypeHandler, DetectionClass, Detector, DetectorContext, RedactionResult } from '../types';

const DICOM_EXTENSIONS = new Set(['.dcm', '.dicom']);
const DICM_MAGIC = Buffer.from('DICM', 'ascii');

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
 * DICOM handler — QUARANTINE STRATEGY, NOT IN-LINE STRIP.
 *
 * A correct DICOM de-identifier must:
 *   - Walk the tag dictionary and strip/replace ~40 PHI-bearing tags
 *     (PatientName, PatientID, PatientBirthDate, StudyDate, InstitutionName,
 *     ReferringPhysicianName, OperatorsName, DeviceSerialNumber, AccessionNumber,
 *     and friends).
 *   - Handle both explicit-VR and implicit-VR transfer syntaxes.
 *   - Re-anchor UIDs (StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID)
 *     to de-identified replacements while preserving referential integrity.
 *   - Strip burned-in identifiers from pixel data (OCR step).
 *
 * This is a substantial library in its own right (see `dcmjs`, `pydicom`).
 * v1 of the Forgetful Agent DOES NOT ATTEMPT it. Instead, DICOM files are
 * detected, quarantined, and the manifest flags them `needs-human-review`.
 *
 * A follow-up PR will integrate `dcmjs` with a configurable tag profile.
 */
export const dicomHandler: ContentTypeHandler = {
    contentType: 'application/dicom',
    matches(filePath: string, firstBytes: Buffer): boolean {
        if (DICOM_EXTENSIONS.has(extensionOf(filePath))) return true;
        // DICM magic at offset 128.
        if (firstBytes.length >= 132) {
            return firstBytes.subarray(128, 132).equals(DICM_MAGIC);
        }
        return false;
    },
    scrub(_input: Buffer, _detectors: readonly Detector[], _context: DetectorContext): RedactionResult {
        // We do not scrub in-line. The orchestrator sees an empty content
        // string + a non-zero count + a synthetic detection to mean
        // "quarantine this file."
        return {
            content: '',
            detections: [
                {
                    className: 'mrn',
                    start: 0,
                    end: 0,
                    placeholder: '[DICOM-QUARANTINE]'
                }
            ],
            counts: zeroCounts()
        };
    }
};
