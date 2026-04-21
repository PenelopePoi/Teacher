// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detector } from '../types';
import { addressDetector } from './address';
import { creditCardDetector } from './credit-card';
import { dobDetector } from './dob';
import { emailDetector } from './email';
import { filePathDetector } from './file-path';
import { genomicIdDetector } from './genomic-id';
import { geoCoordDetector } from './geo-coord';
import { ipv4Detector } from './ipv4';
import { mrnDetector } from './mrn';
import { createNameDetector } from './name-ner';
import { nhsNumberDetector } from './nhs-number';
import { npiDetector } from './npi';
import { phoneDetector } from './phone';
import { ssnDetector } from './ssn';

/**
 * Default detector set — everything regex-based. Name NER is off by default;
 * enable via `createNameDetector({ enabled: true, ... })` and include in the
 * caller's detector list.
 */
export function defaultDetectors(): readonly Detector[] {
    return [
        ssnDetector,
        emailDetector,
        phoneDetector,
        dobDetector,
        mrnDetector,
        nhsNumberDetector,
        npiDetector,
        ipv4Detector,
        creditCardDetector,
        filePathDetector,
        genomicIdDetector,
        geoCoordDetector,
        addressDetector,
        createNameDetector()
    ];
}
