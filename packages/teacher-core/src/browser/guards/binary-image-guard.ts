import { injectable } from '@theia/core/shared/inversify';

/**
 * Binary Image Guard — prevents agents from wasting tokens on raw binary/base64
 * image data while allowing intentional image processing when requested.
 *
 * The problem: Students (or injected prompts) may paste raw binary, hex dumps,
 * or base64-encoded images into the chat. The LLM can't "see" these — it just
 * burns context window on meaningless tokens. Worse, it may hallucinate an
 * interpretation.
 *
 * The solution: Detect binary/base64 image patterns and either:
 *   1. Block + explain (default) — "I can't interpret raw image data. Upload the image directly."
 *   2. Allow + decode (when intentional) — student is learning about encoding, let it through
 *      with a flag so the agent knows to treat it as a teaching moment about binary formats.
 */

export interface GuardResult {
    /** Whether the input should be blocked from the agent. */
    blocked: boolean;
    /** If blocked, the message to show instead of processing. */
    blockMessage?: string;
    /** If allowed, metadata to inject into agent context. */
    metadata?: Record<string, unknown>;
    /** The cleaned input (binary stripped if blocked). */
    cleanedInput: string;
}

/** Patterns that indicate raw binary/hex image data. */
const BINARY_PATTERNS = [
    /[\x00-\x08\x0E-\x1F]{10,}/,                    // Raw binary bytes
    /(?:[0-9a-fA-F]{2}\s?){50,}/,                    // Hex dump (50+ hex pairs)
    /(?:[01]{8}\s?){20,}/,                            // Binary string (20+ octets)
    /\x89PNG\r\n\x1a\n/,                              // PNG magic bytes
    /\xFF\xD8\xFF/,                                    // JPEG magic bytes
    /GIF8[79]a/,                                       // GIF magic bytes
    /RIFF....WEBP/,                                    // WebP magic bytes
];

/** Base64 image data patterns. */
const BASE64_IMAGE_PATTERN = /data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]{100,}/;
const LONG_BASE64_PATTERN = /[A-Za-z0-9+/=]{200,}/;

/** Patterns that indicate the student WANTS to work with binary/encoding. */
const INTENTIONAL_PATTERNS = [
    /how\s+(does|do)\s+(base64|binary|encoding|decoding)\s+work/i,
    /explain\s+(base64|binary|hex|encoding)/i,
    /convert\s+(to|from)\s+(base64|binary|hex)/i,
    /what\s+is\s+(base64|binary encoding|hex dump)/i,
    /teach\s+me\s+(about\s+)?(base64|binary|image encoding)/i,
    /decode\s+this/i,
    /encode\s+this/i,
    /show\s+me\s+the\s+(binary|hex|base64)/i,
    /image\s+(format|header|magic bytes|encoding)/i,
    /file\s+format\s+(analysis|structure)/i,
];

@injectable()
export class BinaryImageGuard {

    /**
     * Check if an input contains raw binary/base64 image data.
     * Returns a GuardResult indicating whether to block or allow.
     */
    check(input: string, agentId?: string): GuardResult {
        // Short inputs are fine — can't contain meaningful binary
        if (input.length < 100) {
            return { blocked: false, cleanedInput: input };
        }

        // Check if student intentionally wants to work with binary/encoding
        const isIntentional = INTENTIONAL_PATTERNS.some(p => p.test(input));

        // Check for base64 image data URIs
        const base64Match = BASE64_IMAGE_PATTERN.exec(input);
        if (base64Match) {
            if (isIntentional) {
                return this.allowWithContext(input, 'base64-image-uri', base64Match[0].length);
            }
            return this.block(input, base64Match[0], 'base64 image data',
                'I detected a base64-encoded image in your message. I can\'t visually interpret base64 text — ' +
                'it\'s just encoded characters to me, not an image.\n\n' +
                '**To share an image:** Upload it directly using the file attachment button.\n' +
                '**To learn about base64:** Ask me "How does base64 encoding work?" and I\'ll teach you the concept.'
            );
        }

        // Check for long base64 strings (without data: prefix)
        const longBase64 = LONG_BASE64_PATTERN.exec(input);
        if (longBase64 && longBase64[0].length > 500 && this.looksLikeBase64(longBase64[0])) {
            if (isIntentional) {
                return this.allowWithContext(input, 'raw-base64', longBase64[0].length);
            }
            return this.block(input, longBase64[0], 'base64 data',
                'This looks like base64-encoded data (possibly an image). I can\'t interpret this visually.\n\n' +
                '**If this is an image:** Upload the file directly instead of pasting the encoding.\n' +
                '**If you\'re learning about encoding:** Say "decode this" or "explain base64" and I\'ll walk you through it.'
            );
        }

        // Check for raw binary patterns
        for (const pattern of BINARY_PATTERNS) {
            if (pattern.test(input)) {
                if (isIntentional) {
                    return this.allowWithContext(input, 'raw-binary', input.length);
                }
                return this.block(input, '', 'binary data',
                    'I detected raw binary or hex data in your message. As a language model, I process text — ' +
                    'raw binary is just noise to me.\n\n' +
                    '**If this is a file:** Open it in the editor or describe what you need help with.\n' +
                    '**If you\'re learning about binary:** Ask me "How do computers store images?" and I\'ll explain.'
                );
            }
        }

        return { blocked: false, cleanedInput: input };
    }

    /**
     * Check a base64 string for image-like characteristics.
     */
    protected looksLikeBase64(str: string): boolean {
        // Check character distribution — real base64 has roughly uniform distribution
        const chars = new Set(str.substring(0, 100));
        // Base64 uses 64 chars + padding; if we see >30 distinct chars, probably base64
        if (chars.size < 30) {
            return false;
        }
        // Check for padding at end
        if (str.endsWith('==') || str.endsWith('=')) {
            return true;
        }
        // Check ratio of alphanumeric to total
        const alphanumeric = str.replace(/[^A-Za-z0-9+/=]/g, '').length;
        return alphanumeric / str.length > 0.95;
    }

    protected block(input: string, binaryPortion: string, dataType: string, message: string): GuardResult {
        // Strip the binary portion from the input, keep any surrounding text
        const cleaned = binaryPortion ? input.replace(binaryPortion, `[${dataType} removed — ${binaryPortion.length} characters]`) : input;
        return {
            blocked: true,
            blockMessage: message,
            cleanedInput: cleaned,
        };
    }

    protected allowWithContext(input: string, detectedType: string, dataLength: number): GuardResult {
        return {
            blocked: false,
            cleanedInput: input,
            metadata: {
                binaryDetected: true,
                detectedType,
                dataLength,
                teachingOpportunity: true,
                note: `Student appears to be intentionally working with ${detectedType}. ` +
                      `This is a teaching moment about data encoding. Explain what the data represents ` +
                      `and how the encoding works rather than trying to interpret the binary content visually.`,
            },
        };
    }
}
