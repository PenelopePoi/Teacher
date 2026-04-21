// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { defaultDetectors, redact } from '../src';

const ctx = { contentType: 'text/plain', filePath: '/tmp/fixture.txt' };
const detectors = defaultDetectors();

describe('redact', () => {
    it('replaces detections with typed placeholders', () => {
        const input = 'Contact alice@example.com at (555) 123-4567';
        const result = redact(input, detectors, ctx);
        expect(result.content).toContain('[REDACTED:EMAIL]');
        expect(result.content).toContain('[REDACTED:PHONE]');
        expect(result.content).not.toContain('alice@example.com');
        expect(result.content).not.toContain('555');
    });

    it('returns input unchanged when nothing matches', () => {
        const input = 'All systems nominal.';
        const result = redact(input, detectors, ctx);
        expect(result.content).toBe(input);
        expect(result.detections).toHaveLength(0);
    });

    it('preserves line count in multi-line text', () => {
        const input = 'Line 1 with alice@example.com\nLine 2 clean\nLine 3 with bob@example.org\n';
        const result = redact(input, detectors, ctx);
        const inputLines = input.split('\n').length;
        const outputLines = result.content.split('\n').length;
        expect(outputLines).toBe(inputLines);
    });

    it('counts detections by class', () => {
        const input = 'alice@a.com and bob@b.com and carol@c.com';
        const result = redact(input, detectors, ctx);
        expect(result.counts.email).toBe(3);
    });

    it('handles overlapping detections without double-redacting', () => {
        const input = 'Call (555) 123-4567';
        const result = redact(input, detectors, ctx);
        // Should contain exactly one [REDACTED:PHONE] placeholder
        const matches = result.content.match(/\[REDACTED:PHONE\]/g) ?? [];
        expect(matches).toHaveLength(1);
    });
});
