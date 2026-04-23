// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { mkdtemp, readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defaultDetectors, defaultHandlers, scrubDirectory, verifyManifest } from '../src';

async function createFixtureTree(root: string): Promise<void> {
    await mkdir(join(root, 'notes'), { recursive: true });
    await mkdir(join(root, 'data'), { recursive: true });

    await writeFile(
        join(root, 'notes', 'visit-01.md'),
        [
            '# Visit note',
            '',
            'Patient MRN: 1234567.',
            'Contact alice@example.com or call (555) 123-4567.',
            'DOB: 05/15/1972.',
            '',
            'See /home/amber/notes.md for context.'
        ].join('\n')
    );

    await writeFile(
        join(root, 'data', 'subjects.json'),
        JSON.stringify({
            study: 'demo',
            subjects: [
                { id: 'SUBJ-001', email: 'bob@example.org', mrn: 'MRN 7890123' },
                { id: 'SUBJ-002', email: 'carol@example.com', mrn: 'MRN: 4567890' }
            ]
        }, undefined, 2)
    );

    await writeFile(
        join(root, 'data', 'points.csv'),
        'id,lat,lon\n1,37.77493,-122.41942\n2,40.71280,-74.00600\n'
    );

    await writeFile(
        join(root, 'notes', 'clean.md'),
        '# Clean\nNothing identifying here.\n'
    );
}

async function listFiles(root: string): Promise<string[]> {
    const out: string[] = [];
    async function walk(dir: string): Promise<void> {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const e of entries) {
            const full = join(dir, e.name);
            if (e.isDirectory()) await walk(full);
            else out.push(full);
        }
    }
    await walk(root);
    return out.sort();
}

describe('scrubDirectory end-to-end', () => {
    let sourceRoot: string;
    let outputRoot: string;
    let quarantineRoot: string;

    beforeEach(async () => {
        const base = await mkdtemp(join(tmpdir(), 'forgetful-e2e-'));
        sourceRoot = join(base, 'src');
        outputRoot = join(base, 'out');
        quarantineRoot = join(base, 'quarantine');
        await mkdir(sourceRoot, { recursive: true });
        await createFixtureTree(sourceRoot);
    });

    afterEach(async () => {
        await rm(sourceRoot, { recursive: true, force: true });
        await rm(outputRoot, { recursive: true, force: true });
        await rm(quarantineRoot, { recursive: true, force: true });
    });

    it('produces scrubbed output containing no seed values', async () => {
        const manifest = await scrubDirectory({
            sourceRoot,
            outputRoot,
            quarantineRoot,
            detectors: defaultDetectors(),
            handlers: defaultHandlers(),
            agentVersion: 'test-0.1.0'
        });

        const outFiles = await listFiles(outputRoot);
        expect(outFiles.length).toBeGreaterThan(0);

        for (const f of outFiles) {
            const content = await readFile(f, 'utf8');
            expect(content).not.toContain('alice@example.com');
            expect(content).not.toContain('bob@example.org');
            expect(content).not.toContain('carol@example.com');
            expect(content).not.toContain('1234567');
            expect(content).not.toContain('(555) 123-4567');
            expect(content).not.toContain('05/15/1972');
            expect(content).not.toContain('/home/amber');
            expect(content).not.toContain('37.77493');
        }

        expect(manifest.totals.email).toBeGreaterThanOrEqual(3);
        expect(manifest.totals.mrn).toBeGreaterThanOrEqual(1);
        expect(manifest.totals.phone).toBeGreaterThanOrEqual(1);
        expect(manifest.totals.dob).toBeGreaterThanOrEqual(1);
        expect(manifest.totals['file-path']).toBeGreaterThanOrEqual(1);
        expect(manifest.totals['geo-coord']).toBeGreaterThanOrEqual(2);
    });

    it('emits a manifest that verifies', async () => {
        const manifest = await scrubDirectory({
            sourceRoot,
            outputRoot,
            quarantineRoot,
            detectors: defaultDetectors(),
            handlers: defaultHandlers(),
            agentVersion: 'test-0.1.0'
        });
        const { hashValid } = await verifyManifest(manifest);
        expect(hashValid).toBe(true);
    });

    it('marks clean files as pass-through', async () => {
        const manifest = await scrubDirectory({
            sourceRoot,
            outputRoot,
            quarantineRoot,
            detectors: defaultDetectors(),
            handlers: defaultHandlers(),
            agentVersion: 'test-0.1.0'
        });
        const clean = manifest.files.find(f => f.path.endsWith('clean.md'));
        expect(clean?.status).toBe('pass-through');
        expect(Object.keys(clean?.counts ?? {})).toHaveLength(0);
    });

    it('never records a detected value in the manifest', async () => {
        const manifest = await scrubDirectory({
            sourceRoot,
            outputRoot,
            quarantineRoot,
            detectors: defaultDetectors(),
            handlers: defaultHandlers(),
            agentVersion: 'test-0.1.0'
        });
        const serialized = JSON.stringify(manifest);
        expect(serialized).not.toContain('alice@example.com');
        expect(serialized).not.toContain('1234567');
        expect(serialized).not.toContain('amber');
    });
});
