// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

/** Barrel export for @guardian/forgetful-core. */

export * from './types';
export { redact } from './redactor';
export {
    canonicalizeManifest,
    hashManifest,
    aggregateTotals,
    finalizeManifest,
    verifyManifest,
    sha256Base64
} from './manifest';
export { withForgettingBuffer, withForgettingBufferSync, isZeroed } from './forget';
export { scrubDirectory } from './forgetful';
export { defaultDetectors } from './detectors/registry';
export { defaultHandlers } from './content-types/registry';
export { ssnDetector } from './detectors/ssn';
export { emailDetector } from './detectors/email';
export { phoneDetector } from './detectors/phone';
export { dobDetector } from './detectors/dob';
export { mrnDetector } from './detectors/mrn';
export { nhsNumberDetector } from './detectors/nhs-number';
export { npiDetector } from './detectors/npi';
export { ipv4Detector } from './detectors/ipv4';
export { creditCardDetector } from './detectors/credit-card';
export { filePathDetector } from './detectors/file-path';
export { genomicIdDetector } from './detectors/genomic-id';
export { geoCoordDetector } from './detectors/geo-coord';
export { addressDetector } from './detectors/address';
export { createNameDetector, type NameNerOptions } from './detectors/name-ner';
export { textHandler } from './content-types/text';
export { markdownHandler } from './content-types/markdown';
export { jsonHandler } from './content-types/json';
export { csvHandler } from './content-types/csv';
export { notebookHandler } from './content-types/notebook';
export { imageExifHandler } from './content-types/image-exif';
export { dicomHandler } from './content-types/dicom';
