// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { writeFile, readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { argv, exit } from 'node:process';
import {
    defaultDetectors,
    defaultHandlers,
    scrubDirectory,
    verifyManifest,
    type ScrubManifest
} from '@guardian/forgetful-core';

interface ParsedArgs {
    command: 'scrub' | 'verify' | 'help';
    input?: string;
    output?: string;
    manifest?: string;
    quarantine?: string;
    signWith?: string;
    previousManifest?: string;
    agentVersion?: string;
}

function parseArgs(argv: readonly string[]): ParsedArgs {
    const args = argv.slice(2);
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
        return { command: 'help' };
    }
    const command = args[0] as 'scrub' | 'verify';
    const result: ParsedArgs = { command };
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        const next = args[i + 1];
        switch (arg) {
            case '--in':
            case '--input':
                result.input = next; i++; break;
            case '--out':
            case '--output':
                result.output = next; i++; break;
            case '--manifest':
                result.manifest = next; i++; break;
            case '--quarantine':
                result.quarantine = next; i++; break;
            case '--sign-with':
                result.signWith = next; i++; break;
            case '--previous-manifest':
                result.previousManifest = next; i++; break;
            case '--agent-version':
                result.agentVersion = next; i++; break;
            default:
                throw new Error(`Unknown argument: ${arg}`);
        }
    }
    return result;
}

function printHelp(): void {
    const help = `forgetful — PII/PHI scrubber CLI

Usage:
  forgetful scrub --in <dir> --out <dir> [--manifest <path>] [--quarantine <dir>]
                  [--sign-with <keyid>] [--previous-manifest <path>] [--agent-version <str>]

  forgetful verify --manifest <path>

Commands:
  scrub    Walk the input directory, redact PII/PHI, write scrubbed output
           to the output directory, and emit a manifest describing what
           was removed (types + counts, never values).

  verify   Recompute the manifest's hash (and, if present, verify its
           signature). Exit non-zero if the manifest is tampered with.

Options:
  --in <dir>, --input <dir>
      Source directory. Read-only.
  --out <dir>, --output <dir>
      Destination directory for scrubbed output. Created if missing.
  --manifest <path>
      Path to write (or read) the manifest JSON. Defaults to
      ./scrub-manifest.json in the current directory.
  --quarantine <dir>
      Directory for files the agent refuses to auto-process.
      Defaults to ./scrub-quarantine.
  --sign-with <keyid>
      Signer identifier. In v1 this is a placeholder — local signing
      fallback is not yet wired in; leaving this off produces an
      unsigned manifest suitable for local dry-runs.
  --previous-manifest <path>
      Path to a prior manifest to chain off of. Optional.
  --agent-version <str>
      Version string to embed. Defaults to the package version.

Forgetfulness property:
  The agent holds no detected values beyond the lifetime of each file's
  processing. The manifest records TYPES (ssn, email, ...) and COUNTS
  per file, never the matched text.

See FORKING.md for forker obligations and docs/forgetful-threat-model.md
for the threat model.
`;
    process.stdout.write(help);
}

async function runScrub(args: ParsedArgs): Promise<number> {
    if (!args.input || !args.output) {
        process.stderr.write('Error: --in and --out are required.\n');
        return 2;
    }
    const sourceRoot = resolve(args.input);
    const outputRoot = resolve(args.output);
    const quarantineRoot = resolve(args.quarantine ?? './scrub-quarantine');
    const manifestPath = resolve(args.manifest ?? './scrub-manifest.json');

    try {
        await access(sourceRoot);
    } catch {
        process.stderr.write(`Error: input directory not found: ${sourceRoot}\n`);
        return 2;
    }

    let previousManifestHash = '';
    if (args.previousManifest) {
        try {
            const prev = JSON.parse(await readFile(args.previousManifest, 'utf8')) as ScrubManifest;
            previousManifestHash = prev.currentHash;
        } catch (err) {
            process.stderr.write(`Error reading previous manifest: ${(err as Error).message}\n`);
            return 2;
        }
    }

    if (args.signWith) {
        process.stderr.write(
            'Warning: --sign-with is reserved for the signer integration. ' +
            'v1 produces an unsigned manifest. A follow-up release will wire in ' +
            'KMS (from @guardian/lambda) and a local age/minisign fallback.\n'
        );
    }

    const manifest = await scrubDirectory({
        sourceRoot,
        outputRoot,
        quarantineRoot,
        detectors: defaultDetectors(),
        handlers: defaultHandlers(),
        previousManifestHash,
        agentVersion: args.agentVersion ?? '0.1.0'
    });

    await writeFile(manifestPath, JSON.stringify(manifest, undefined, 2), 'utf8');

    const totals = manifest.totals;
    const totalDetections = Object.values(totals).reduce((a, b) => a + b, 0);
    const scrubbed = manifest.files.filter(f => f.status === 'scrubbed').length;
    const passThrough = manifest.files.filter(f => f.status === 'pass-through').length;
    const quarantined = manifest.files.filter(f => f.status === 'quarantined').length;

    process.stdout.write(`Scrubbed ${manifest.files.length} file(s).\n`);
    process.stdout.write(`  ${scrubbed} with detections, ${passThrough} clean, ${quarantined} quarantined.\n`);
    process.stdout.write(`  ${totalDetections} total detection(s) by class:\n`);
    for (const [k, v] of Object.entries(totals)) {
        if (v > 0) process.stdout.write(`    ${k}: ${v}\n`);
    }
    process.stdout.write(`Manifest written to ${manifestPath}\n`);
    process.stdout.write(`Output directory: ${outputRoot}\n`);
    if (quarantined > 0) {
        process.stdout.write(`Quarantine directory: ${quarantineRoot}\n`);
        process.stdout.write('  Review quarantined files by hand before publishing.\n');
    }
    return 0;
}

async function runVerify(args: ParsedArgs): Promise<number> {
    if (!args.manifest) {
        process.stderr.write('Error: --manifest <path> is required for verify.\n');
        return 2;
    }
    const manifestPath = resolve(args.manifest);
    let manifest: ScrubManifest;
    try {
        manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ScrubManifest;
    } catch (err) {
        process.stderr.write(`Error reading manifest: ${(err as Error).message}\n`);
        return 2;
    }
    const { hashValid, signatureValid } = await verifyManifest(manifest);
    process.stdout.write(`Hash valid: ${hashValid}\n`);
    if (manifest.signature) {
        if (signatureValid === undefined) {
            process.stdout.write('Signature present but no verifier configured; cannot verify.\n');
        } else {
            process.stdout.write(`Signature valid: ${signatureValid}\n`);
        }
    } else {
        process.stdout.write('Manifest is unsigned.\n');
    }
    return hashValid && (signatureValid !== false) ? 0 : 1;
}

async function main(): Promise<void> {
    let parsed: ParsedArgs;
    try {
        parsed = parseArgs(argv);
    } catch (err) {
        process.stderr.write(`${(err as Error).message}\n`);
        printHelp();
        exit(2);
    }

    if (parsed.command === 'help') {
        printHelp();
        exit(0);
    }

    let code: number;
    if (parsed.command === 'scrub') {
        code = await runScrub(parsed);
    } else if (parsed.command === 'verify') {
        code = await runVerify(parsed);
    } else {
        printHelp();
        code = 2;
    }
    exit(code);
}

main().catch(err => {
    process.stderr.write(`Fatal: ${(err as Error).stack ?? (err as Error).message}\n`);
    exit(1);
});
