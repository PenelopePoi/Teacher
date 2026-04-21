// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { withForgettingBuffer } from './forget';
import { aggregateTotals, finalizeManifest, sha256Base64 } from './manifest';
import {
    ContentTypeHandler,
    DetectionClass,
    ManifestFileEntry,
    RedactionResult,
    ScrubManifest,
    ScrubOptions
} from './types';

const ALL_CLASSES: readonly DetectionClass[] = [
    'ssn', 'email', 'phone', 'dob', 'mrn', 'nhs-number', 'npi',
    'name', 'address', 'geo-coord', 'genomic-id', 'file-path',
    'ipv4', 'credit-card'
];

async function* walk(root: string): AsyncGenerator<string> {
    const entries = await readdir(root, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === '.git' || entry.name === 'node_modules') continue;
        const full = join(root, entry.name);
        if (entry.isDirectory()) {
            yield* walk(full);
        } else if (entry.isFile()) {
            yield full;
        }
    }
}

function isDicomQuarantine(result: RedactionResult): boolean {
    return (
        result.content === '' &&
        result.detections.length === 1 &&
        result.detections[0].placeholder === '[DICOM-QUARANTINE]'
    );
}

function trimCounts(counts: Readonly<Record<DetectionClass, number>>): Partial<Record<DetectionClass, number>> {
    const out: Partial<Record<DetectionClass, number>> = {};
    for (const k of ALL_CLASSES) {
        const v = counts[k];
        if (v && v > 0) out[k] = v;
    }
    return out;
}

async function pickHandler(
    filePath: string,
    firstBytes: Buffer,
    handlers: readonly ContentTypeHandler[]
): Promise<ContentTypeHandler | undefined> {
    for (const h of handlers) {
        if (h.matches(filePath, firstBytes)) return h;
    }
    return undefined;
}

async function processFile(
    absPath: string,
    options: ScrubOptions
): Promise<ManifestFileEntry> {
    const relPath = relative(options.sourceRoot, absPath);
    const stats = await stat(absPath);
    const bytes = await readFile(absPath);

    const firstBytes = bytes.subarray(0, Math.min(bytes.length, 512));
    const handler = await pickHandler(absPath, firstBytes, options.handlers);

    if (!handler) {
        // Unknown format — quarantine.
        const dest = join(options.quarantineRoot, relPath);
        await mkdir(dirname(dest), { recursive: true });
        await writeFile(dest, bytes);
        return {
            path: relPath,
            sha256Before: sha256Base64(bytes),
            sha256After: sha256Base64(bytes),
            bytesBefore: stats.size,
            bytesAfter: stats.size,
            contentType: 'application/octet-stream',
            status: 'quarantined',
            counts: {},
            notes: 'unknown-content-type'
        };
    }

    // Use the forgetting buffer to ensure we don't retain the raw bytes.
    const { result, outBytes } = await withForgettingBuffer(bytes, async buf => {
        const r = handler.scrub(buf, options.detectors, {
            contentType: handler.contentType,
            filePath: absPath
        });
        if (isDicomQuarantine(r)) {
            return { result: r, outBytes: undefined };
        }
        const out = handler.contentType.startsWith('image/')
            ? Buffer.from(r.content, 'binary')
            : Buffer.from(r.content, 'utf8');
        return { result: r, outBytes: out };
    });

    if (isDicomQuarantine(result)) {
        const dest = join(options.quarantineRoot, relPath);
        await mkdir(dirname(dest), { recursive: true });
        await writeFile(dest, bytes);
        return {
            path: relPath,
            sha256Before: sha256Base64(bytes),
            sha256After: sha256Base64(bytes),
            bytesBefore: stats.size,
            bytesAfter: stats.size,
            contentType: handler.contentType,
            status: 'quarantined',
            counts: {},
            notes: 'dicom-deferred-to-human-review'
        };
    }

    const destOut = outBytes!;
    const destPath = join(options.outputRoot, relPath);
    await mkdir(dirname(destPath), { recursive: true });
    await writeFile(destPath, destOut);

    const trimmedCounts = trimCounts(result.counts);
    const anyDetection = Object.values(trimmedCounts).some(v => typeof v === 'number' && v > 0);

    return {
        path: relPath.split(sep).join('/'),
        sha256Before: sha256Base64(bytes),
        sha256After: sha256Base64(destOut),
        bytesBefore: stats.size,
        bytesAfter: destOut.length,
        contentType: handler.contentType,
        status: anyDetection ? 'scrubbed' : 'pass-through',
        counts: trimmedCounts
    };
}

/**
 * Scrub an entire directory tree.
 *
 * Walks `sourceRoot`, dispatches each file to a content-type handler, writes
 * redacted output under `outputRoot`, quarantines files the agent cannot
 * handle safely, and returns a finalized (optionally signed) manifest.
 *
 * This function is the entry point the CLI wraps. It is also the entry point
 * tests call for end-to-end verification.
 */
export async function scrubDirectory(options: ScrubOptions): Promise<ScrubManifest> {
    const sourceRoot = resolve(options.sourceRoot);
    const outputRoot = resolve(options.outputRoot);
    const quarantineRoot = resolve(options.quarantineRoot);
    await mkdir(outputRoot, { recursive: true });
    await mkdir(quarantineRoot, { recursive: true });

    const files: ManifestFileEntry[] = [];
    for await (const absPath of walk(sourceRoot)) {
        const entry = await processFile(absPath, {
            ...options,
            sourceRoot,
            outputRoot,
            quarantineRoot
        });
        files.push(entry);
    }

    const totals = aggregateTotals(files);
    const canonical = {
        version: 1 as const,
        scrubbedAt: new Date().toISOString(),
        sessionId: randomUUID(),
        agentVersion: options.agentVersion,
        sourceRoot,
        outputRoot,
        files,
        totals,
        previousHash: options.previousManifestHash ?? ''
    };
    return finalizeManifest(canonical, options.signer);
}
