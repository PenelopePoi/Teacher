// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { isZeroed, withForgettingBuffer, withForgettingBufferSync } from '../src';

describe('withForgettingBuffer', () => {
    it('zeroes the buffer after fn returns', async () => {
        const seed = Buffer.from('this-value-should-not-persist');
        let captured: Buffer | undefined;
        await withForgettingBuffer(seed, async buf => {
            captured = buf;
            expect(buf.toString('utf8')).toBe('this-value-should-not-persist');
        });
        expect(captured).toBeDefined();
        expect(isZeroed(captured!)).toBe(true);
    });

    it('zeroes the buffer even if fn throws', async () => {
        const seed = Buffer.from('crash-value');
        let captured: Buffer | undefined;
        await expect(
            withForgettingBuffer(seed, async buf => {
                captured = buf;
                throw new Error('boom');
            })
        ).rejects.toThrow('boom');
        expect(captured).toBeDefined();
        expect(isZeroed(captured!)).toBe(true);
    });

    it('does not mutate the caller-supplied buffer', async () => {
        const seed = Buffer.from('caller-buffer-preserved');
        const copy = Buffer.from(seed);
        await withForgettingBuffer(seed, async () => { /* noop */ });
        expect(seed.equals(copy)).toBe(true);
    });
});

describe('withForgettingBufferSync', () => {
    it('zeroes the buffer after sync fn returns', () => {
        const seed = Buffer.from('sync-value');
        let captured: Buffer | undefined;
        withForgettingBufferSync(seed, buf => {
            captured = buf;
        });
        expect(isZeroed(captured!)).toBe(true);
    });
});
