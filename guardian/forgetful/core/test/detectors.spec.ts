// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import {
    addressDetector,
    creditCardDetector,
    dobDetector,
    emailDetector,
    filePathDetector,
    genomicIdDetector,
    geoCoordDetector,
    ipv4Detector,
    mrnDetector,
    nhsNumberDetector,
    npiDetector,
    phoneDetector,
    ssnDetector
} from '../src';

const ctx = { contentType: 'text/plain', filePath: '/tmp/fixture.txt' };

describe('ssnDetector', () => {
    it('matches standard NNN-NN-NNNN', () => {
        // 123-45-6789 is a synthetic SSA-invalid test value (area 123, group 45, serial 6789)
        const detections = ssnDetector.detect('Patient SSN 123-45-6789 on file.', ctx);
        expect(detections).toHaveLength(1);
        expect(detections[0].className).toBe('ssn');
        expect(detections[0].placeholder).toBe('[REDACTED:SSN]');
    });

    it('rejects invalid area numbers (000, 666, 9xx)', () => {
        expect(ssnDetector.detect('000-12-3456', ctx)).toHaveLength(0);
        expect(ssnDetector.detect('666-12-3456', ctx)).toHaveLength(0);
        expect(ssnDetector.detect('900-12-3456', ctx)).toHaveLength(0);
    });

    it('ignores bare 9-digit numbers', () => {
        expect(ssnDetector.detect('Order 123456789 received', ctx)).toHaveLength(0);
    });
});

describe('emailDetector', () => {
    it('matches common email forms', () => {
        const content = 'Contact alice@example.com or bob.smith+tag@sub.domain.co.uk';
        const detections = emailDetector.detect(content, ctx);
        expect(detections.length).toBeGreaterThanOrEqual(2);
    });

    it('does not match template placeholders like {user}@example.com', () => {
        const detections = emailDetector.detect('Template: {user}@example.com', ctx);
        expect(detections).toHaveLength(0);
    });
});

describe('phoneDetector', () => {
    it('matches (NNN) NNN-NNNN', () => {
        const detections = phoneDetector.detect('Call (555) 123-4567 today', ctx);
        expect(detections).toHaveLength(1);
    });

    it('matches international +1 555 123 4567', () => {
        const detections = phoneDetector.detect('Intl: +1 555 123 4567', ctx);
        expect(detections).toHaveLength(1);
    });

    it('ignores strings with too few digits', () => {
        const detections = phoneDetector.detect('12-34-56', ctx);
        expect(detections).toHaveLength(0);
    });
});

describe('dobDetector', () => {
    it('matches explicit DOB labels', () => {
        const detections = dobDetector.detect('DOB: 05/15/1972', ctx);
        expect(detections).toHaveLength(1);
    });

    it('does NOT match bare dates without a DOB label', () => {
        const detections = dobDetector.detect('Release on 2024-01-15', ctx);
        expect(detections).toHaveLength(0);
    });

    it('matches "Date of Birth: January 1, 1980"', () => {
        const detections = dobDetector.detect('Date of Birth: January 1, 1980', ctx);
        expect(detections).toHaveLength(1);
    });
});

describe('mrnDetector', () => {
    it('matches MRN: 1234567', () => {
        const detections = mrnDetector.detect('Patient MRN: 1234567 admitted', ctx);
        expect(detections).toHaveLength(1);
    });

    it('does not match bare 7-digit numbers', () => {
        const detections = mrnDetector.detect('Invoice 1234567 paid', ctx);
        expect(detections).toHaveLength(0);
    });
});

describe('nhsNumberDetector', () => {
    it('matches a valid Mod-11 NHS number', () => {
        // 9434765919 — Mod-11 valid (verified by hand)
        const detections = nhsNumberDetector.detect('NHS 943 476 5919', ctx);
        expect(detections).toHaveLength(1);
    });

    it('rejects a number that fails the Mod-11 check', () => {
        const detections = nhsNumberDetector.detect('943 476 5918', ctx);
        expect(detections).toHaveLength(0);
    });
});

describe('npiDetector', () => {
    it('matches a Luhn-valid NPI when labeled', () => {
        // 1234567893 — standard NPI test number
        const detections = npiDetector.detect('NPI: 1234567893', ctx);
        expect(detections).toHaveLength(1);
    });

    it('rejects a label without a Luhn-valid number', () => {
        const detections = npiDetector.detect('NPI: 1234567890', ctx);
        expect(detections).toHaveLength(0);
    });
});

describe('ipv4Detector', () => {
    it('matches a public IP', () => {
        const detections = ipv4Detector.detect('Origin 8.8.8.8 replied', ctx);
        expect(detections).toHaveLength(1);
    });

    it('skips private ranges', () => {
        expect(ipv4Detector.detect('Host 10.0.0.1', ctx)).toHaveLength(0);
        expect(ipv4Detector.detect('Host 192.168.1.1', ctx)).toHaveLength(0);
        expect(ipv4Detector.detect('Loop 127.0.0.1', ctx)).toHaveLength(0);
    });
});

describe('creditCardDetector', () => {
    it('matches a Luhn-valid 16-digit number', () => {
        // 4111 1111 1111 1111 — Visa test number, Luhn-valid
        const detections = creditCardDetector.detect('Card 4111 1111 1111 1111', ctx);
        expect(detections).toHaveLength(1);
    });

    it('rejects Luhn-invalid sequences', () => {
        const detections = creditCardDetector.detect('1234 5678 9012 3456', ctx);
        expect(detections).toHaveLength(0);
    });
});

describe('filePathDetector', () => {
    it('redacts macOS /Users/<name>/ paths', () => {
        const detections = filePathDetector.detect('/Users/amber/Documents/notes.md', ctx);
        expect(detections).toHaveLength(1);
        expect(detections[0].placeholder).toBe('anon-user');
    });

    it('redacts Linux /home/<name>/ paths', () => {
        const detections = filePathDetector.detect('/home/bob/work/src/main.ts', ctx);
        expect(detections).toHaveLength(1);
    });

    it('redacts Windows C:\\Users\\<name>\\ paths', () => {
        const detections = filePathDetector.detect('C:\\Users\\Carol\\Desktop\\file.txt', ctx);
        expect(detections).toHaveLength(1);
    });
});

describe('genomicIdDetector', () => {
    it('matches dbGaP IDs', () => {
        const detections = genomicIdDetector.detect('Study phs000123.v1.p1 released', ctx);
        expect(detections).toHaveLength(1);
    });

    it('matches TCGA barcodes', () => {
        const detections = genomicIdDetector.detect('Sample TCGA-AB-1234-01A collected', ctx);
        expect(detections).toHaveLength(1);
    });

    it('matches labeled Subject IDs', () => {
        const detections = genomicIdDetector.detect('Subject ID: SUBJ-0042', ctx);
        expect(detections).toHaveLength(1);
    });
});

describe('geoCoordDetector', () => {
    it('matches high-precision decimal pairs', () => {
        const detections = geoCoordDetector.detect('Location 37.77493, -122.41942', ctx);
        expect(detections).toHaveLength(1);
    });

    it('skips low-precision region references', () => {
        const detections = geoCoordDetector.detect('Near 37.5, -122.3', ctx);
        expect(detections).toHaveLength(0);
    });
});

describe('addressDetector', () => {
    it('matches US street addresses', () => {
        const detections = addressDetector.detect('Ship to 123 Main Street', ctx);
        expect(detections).toHaveLength(1);
    });

    it('does not match a bare number', () => {
        const detections = addressDetector.detect('Room 123', ctx);
        expect(detections).toHaveLength(0);
    });
});
