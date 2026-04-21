// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { Detection, Detector, DetectorContext } from '../types';

/**
 * IPv4 detector. Excludes obvious non-identifying ranges (0.0.0.0, 127.x,
 * 10.x, 192.168.x, 172.16-31.x) because those are commonly used as
 * placeholders in docs and tests.
 */
const IPV4_RE = /\b((?:\d{1,3}\.){3}\d{1,3})\b/g;

function isPublicIp(octets: readonly number[]): boolean {
    if (octets.some(o => o < 0 || o > 255)) return false;
    const [a, b] = octets;
    if (a === 0 || a === 127) return false; // zero + loopback
    if (a === 10) return false; // private
    if (a === 192 && b === 168) return false; // private
    if (a === 172 && b >= 16 && b <= 31) return false; // private
    if (a === 169 && b === 254) return false; // link-local
    if (a >= 224) return false; // multicast + reserved
    return true;
}

export const ipv4Detector: Detector = {
    className: 'ipv4',
    detect(content: string, _context: DetectorContext): readonly Detection[] {
        const detections: Detection[] = [];
        let match: RegExpExecArray | null;
        IPV4_RE.lastIndex = 0;
        while ((match = IPV4_RE.exec(content)) !== null) {
            const octets = match[1].split('.').map(Number);
            if (octets.length !== 4) continue;
            if (!isPublicIp(octets)) continue;
            detections.push({
                className: 'ipv4',
                start: match.index,
                end: match.index + match[0].length,
                placeholder: '[REDACTED:IPV4]'
            });
        }
        return detections;
    }
};
