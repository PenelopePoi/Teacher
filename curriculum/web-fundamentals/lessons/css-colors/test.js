/**
 * Tests for Colors, Fonts & Visual Identity
 *
 * Validates that the student applied meaningful CSS styling.
 * Run with: node test.js
 */
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf-8');
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  PASS: ${message}`);
        passed++;
    } else {
        console.log(`  FAIL: ${message}`);
        failed++;
    }
}

console.log('Testing: Colors, Fonts & Visual Identity\n');

// Body styling
assert(/body\s*\{[^}]*background-color\s*:/i.test(cssNoComments), 'Body has a background-color defined');
assert(/body\s*\{[^}]*\bcolor\s*:/i.test(cssNoComments), 'Body has a text color defined');
assert(/body\s*\{[^}]*font-family\s*:/i.test(cssNoComments), 'Body has a font-family defined');

// Heading styling
assert(/h1\s*\{[^}]*font-family\s*:/i.test(cssNoComments), 'h1 has a font-family (distinct typography)');
assert(/h1\s*\{[^}]*color\s*:/i.test(cssNoComments), 'h1 has a color defined');
assert(/h2\s*\{[^}]*color\s*:/i.test(cssNoComments), 'h2 has a color defined');

// Color format variety
const hasHex = /#[0-9a-fA-F]{3,8}/i.test(cssNoComments);
const hasRgb = /rgb\s*\(/i.test(cssNoComments);
const hasNamedColor = /color\s*:\s*[a-zA-Z]+\s*;/i.test(cssNoComments);
const colorFormats = [hasHex, hasRgb, hasNamedColor].filter(Boolean).length;
assert(colorFormats >= 2, 'At least 2 different color formats used (hex, rgb, named)');

// Font variety
const fontDeclarations = cssNoComments.match(/font-family\s*:[^;]+;/gi) || [];
const uniqueFonts = new Set(fontDeclarations.map(f => f.toLowerCase().trim()));
assert(uniqueFonts.size >= 2, 'At least 2 different font-family declarations exist');

// Class styling
assert(/\.hero\s*\{[^}]*background-color\s*:/i.test(cssNoComments), '.hero class has a background-color');
assert(/\.hero\s*\{[^}]*text-align\s*:/i.test(cssNoComments), '.hero class centers text');
assert(/\.featured\s*\{[^}]*font-weight\s*:/i.test(cssNoComments), '.featured class has font-weight styling');

// Footer
assert(/footer\s*\{[^}]*background-color\s*:/i.test(cssNoComments), 'Footer has a background-color');
assert(/footer\s*\{[^}]*\bcolor\s*:/i.test(cssNoComments), 'Footer has a text color for contrast');

console.log(`\n${passed} passed, ${failed} failed out of ${passed + failed} tests`);
process.exit(failed > 0 ? 1 : 0);
