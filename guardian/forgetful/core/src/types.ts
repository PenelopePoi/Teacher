// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

/**
 * Type surface for the Forgetful Agent.
 *
 * The agent processes source content, detects PII/PHI, emits redacted output
 * and a signed manifest of WHAT was removed (types + counts per file, never
 * values). It is "forgetful" in the sense that no detected values persist
 * beyond the lifetime of a single file's processing.
 *
 * See §23 of the paper (Non-Supremacy applied to data subjects) and the
 * repository's `FORKING.md` for the threat model boundary.
 */

/** The finite set of detector classes v1 supports. */
export type DetectionClass =
    | 'ssn'
    | 'email'
    | 'phone'
    | 'dob'
    | 'mrn'
    | 'nhs-number'
    | 'npi'
    | 'name'
    | 'address'
    | 'geo-coord'
    | 'genomic-id'
    | 'file-path'
    | 'ipv4'
    | 'credit-card';

/**
 * A single detected range in a content buffer.
 *
 * `start` and `end` are UTF-16 code-unit offsets (standard JS string offsets),
 * half-open interval. The actual matched value never leaves the detector —
 * redaction operates on offsets, not captured text.
 */
export interface Detection {
    readonly className: DetectionClass;
    readonly start: number;
    readonly end: number;
    /**
     * Stable placeholder to substitute at `[start, end)`. Includes the class
     * name and (optionally) an index for grouping — e.g. `[REDACTED:NAME-1]`
     * when the same name appears repeatedly and the redactor chooses to
     * preserve co-reference.
     */
    readonly placeholder: string;
}

/**
 * Context passed to a detector — currently minimal, but reserved for
 * content-type hints and configuration knobs.
 */
export interface DetectorContext {
    /** Content type the detector is running against, e.g. `text/markdown`. */
    readonly contentType: string;
    /** Path of the file being processed, for file-path-class detection. */
    readonly filePath: string;
}

/** Pluggable detector. One file per class under `src/detectors/`. */
export interface Detector {
    readonly className: DetectionClass;
    /** Return all detections in the given content, in any order. */
    detect(content: string, context: DetectorContext): readonly Detection[];
}

/** Result of a redaction pass over a single content buffer. */
export interface RedactionResult {
    readonly content: string;
    readonly detections: readonly Detection[];
    /** Count by class. Values are never recorded. */
    readonly counts: Readonly<Record<DetectionClass, number>>;
}

/** A single file's scrub record. Part of the manifest. */
export interface ManifestFileEntry {
    /** Relative path under the source root. */
    readonly path: string;
    /** SHA-256 of the raw input bytes, base64. */
    readonly sha256Before: string;
    /** SHA-256 of the scrubbed output bytes, base64. */
    readonly sha256After: string;
    /** Size of raw input in bytes. */
    readonly bytesBefore: number;
    /** Size of scrubbed output in bytes. */
    readonly bytesAfter: number;
    /** Content type we dispatched on. */
    readonly contentType: string;
    /**
     * Status of this file:
     * - `scrubbed`: processed, redactions applied (zero or more).
     * - `pass-through`: processed, no detections — output === input.
     * - `quarantined`: refused to auto-process; left in quarantine for human review.
     * - `skipped`: not a candidate for scrubbing (e.g. binary we don't understand).
     */
    readonly status: 'scrubbed' | 'pass-through' | 'quarantined' | 'skipped';
    /** Counts per detection class. Absent classes have count 0; omitted from serialization. */
    readonly counts: Partial<Record<DetectionClass, number>>;
    /** Free-form notes (e.g. quarantine reason). Must never contain detected values. */
    readonly notes?: string;
}

/** The top-level signed manifest. */
export interface ScrubManifest {
    readonly version: 1;
    /** ISO 8601 timestamp of the scrub run. */
    readonly scrubbedAt: string;
    /** Opaque identifier for this scrub session (UUID v4 recommended). */
    readonly sessionId: string;
    /** Fingerprint of the agent build (git SHA or package version). */
    readonly agentVersion: string;
    /** The source root directory, normalized. */
    readonly sourceRoot: string;
    /** The output root directory, normalized. */
    readonly outputRoot: string;
    /** Per-file records. */
    readonly files: readonly ManifestFileEntry[];
    /** Aggregate counts across all files. */
    readonly totals: Readonly<Record<DetectionClass, number>>;
    /** Previous manifest's `currentHash`, for chaining. Empty string for the first run. */
    readonly previousHash: string;
    /** This manifest's hash over its canonical bytes (excluding `currentHash` and `signature`). */
    readonly currentHash: string;
    /** Detached signature over `currentHash`. Optional — local signing fallback may be absent. */
    readonly signature?: string;
    /** Key identifier for `signature`, if signed. */
    readonly signatureKeyId?: string;
}

/** Canonical input for hashing a manifest. Excludes the hash and signature fields. */
export type ScrubManifestCanonicalInput = Omit<
    ScrubManifest,
    'currentHash' | 'signature' | 'signatureKeyId'
>;

/**
 * Signer interface. Re-exported from guardian/core conceptually — we accept the
 * same shape so `@guardian/lambda`'s KMS signer plugs in directly. A local
 * fallback (age/minisign shell-out or a zero-signer for tests) implements the
 * same interface.
 */
export interface ManifestSigner {
    sign(bytes: Uint8Array): Promise<{ signature: string; keyId: string }>;
    verify(bytes: Uint8Array, signature: string, keyId: string): Promise<boolean>;
}

/**
 * Content-type handler — knows how to dispatch detectors over a specific file
 * format. Handlers for structured formats (JSON, CSV, DICOM) may run detectors
 * only on specific fields rather than the whole buffer.
 */
export interface ContentTypeHandler {
    /** MIME-like identifier. */
    readonly contentType: string;
    /** Does this handler match the given filename / initial bytes? */
    matches(filePath: string, firstBytes: Buffer): boolean;
    /** Scrub the file content. Detectors are provided by the orchestrator. */
    scrub(input: Buffer, detectors: readonly Detector[], context: DetectorContext): RedactionResult;
}

/** Top-level options for a scrub run. */
export interface ScrubOptions {
    /** Source directory to scrub. Read-only. */
    readonly sourceRoot: string;
    /** Output directory for scrubbed content. Created if missing. */
    readonly outputRoot: string;
    /** Quarantine directory for refused files. Created if missing. */
    readonly quarantineRoot: string;
    /** Active detectors. */
    readonly detectors: readonly Detector[];
    /** Active content-type handlers, in priority order. */
    readonly handlers: readonly ContentTypeHandler[];
    /** Signer for the manifest. If absent, manifest is unsigned (local dry-run only). */
    readonly signer?: ManifestSigner;
    /** Previous manifest's `currentHash`, for chaining. Empty string if none. */
    readonly previousManifestHash?: string;
    /** Agent version string (package.json version or git SHA). */
    readonly agentVersion: string;
}
