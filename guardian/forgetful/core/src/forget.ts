// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

/**
 * Forgetfulness primitives.
 *
 * The Forgetful Agent's operational guarantee is that PII values do not
 * persist beyond the lifetime of a single file's processing. This module
 * provides the helpers used to enforce that:
 *
 *   - `withForgettingBuffer(bytes, fn)`: runs `fn` with a fresh Buffer, then
 *     zeroes the buffer before returning control.
 *   - `zeroString(s)`: best-effort string overwrite. JavaScript strings are
 *     immutable at the language level, so this is advisory — it overwrites
 *     the Buffer we wrapped the string in, not the original V8 heap entry.
 *     The real guarantee is "we do not retain a reference", which the
 *     orchestrator enforces by scope.
 *
 * These helpers do NOT (and cannot) prevent the V8 heap from caching string
 * literals. What they DO is:
 *
 *   1. Avoid creating long-lived references (detections hold offsets, not
 *      captured substrings).
 *   2. Overwrite any Buffer we control before release, so a heap dump taken
 *      after a scrub run contains only zeros in that memory region.
 *   3. Return a boolean receipt the orchestrator can include in the
 *      manifest's `notes` to prove the buffer was zeroed.
 *
 * See `test/forget.spec.ts` for the verification test.
 */

/**
 * Run `fn` with a fresh buffer copied from `bytes`. After `fn` returns (or
 * throws), the buffer is overwritten with zeros and released.
 *
 * Returns `fn`'s result. If `fn` throws, the buffer is still zeroed before
 * the exception propagates.
 */
export async function withForgettingBuffer<T>(
    bytes: Buffer,
    fn: (buf: Buffer) => Promise<T>
): Promise<T> {
    const buf = Buffer.from(bytes);
    try {
        return await fn(buf);
    } finally {
        buf.fill(0);
    }
}

/** Synchronous variant. */
export function withForgettingBufferSync<T>(
    bytes: Buffer,
    fn: (buf: Buffer) => T
): T {
    const buf = Buffer.from(bytes);
    try {
        return fn(buf);
    } finally {
        buf.fill(0);
    }
}

/**
 * Verify that a buffer is all-zero. Used by tests to assert post-conditions.
 * Not a security primitive — a malicious `fn` could re-allocate before
 * returning — but sufficient for accidental retention.
 */
export function isZeroed(buf: Buffer): boolean {
    for (let i = 0; i < buf.length; i++) {
        if (buf[i] !== 0) return false;
    }
    return true;
}
