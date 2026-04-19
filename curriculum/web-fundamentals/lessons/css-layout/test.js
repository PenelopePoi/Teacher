/**
 * Tests for Layout with Flexbox
 *
 * Validates that the student used Flexbox to create a responsive card layout.
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

console.log('Testing: Layout with Flexbox\n');

// Count flex usages
const flexCount = (cssNoComments.match(/display\s*:\s*flex/gi) || []).length;
assert(flexCount >= 3, `At least 3 containers use display: flex (found ${flexCount})`);

// Card grid layout
assert(/\.card-grid\s*\{[^}]*display\s*:\s*flex/i.test(cssNoComments), '.card-grid uses display: flex');
assert(/\.card-grid\s*\{[^}]*flex-wrap\s*:\s*wrap/i.test(cssNoComments), '.card-grid uses flex-wrap: wrap for responsiveness');
assert(/\.card-grid\s*\{[^}]*justify-content\s*:/i.test(cssNoComments), '.card-grid sets justify-content for alignment');
assert(/\.card-grid\s*\{[^}]*gap\s*:/i.test(cssNoComments), '.card-grid uses gap for spacing between cards');

// Card styling
assert(/\.card\s*\{[^}]*background/i.test(cssNoComments), '.card has a background color');
assert(/\.card\s*\{[^}]*padding\s*:/i.test(cssNoComments), '.card has padding');
assert(/\.card\s*\{[^}]*flex\s*:/i.test(cssNoComments) || /\.card\s*\{[^}]*flex-basis\s*:/i.test(cssNoComments), '.card has a flex size defined');

// Navigation layout
assert(/\.nav-bar\s*\{[^}]*display\s*:\s*flex/i.test(cssNoComments), '.nav-bar uses display: flex');
assert(/\.nav-bar\s*\{[^}]*justify-content\s*:/i.test(cssNoComments), '.nav-bar uses justify-content');

// Header layout
assert(/\.page-header\s*\{[^}]*display\s*:\s*flex/i.test(cssNoComments), '.page-header uses display: flex');
assert(/\.page-header\s*\{[^}]*align-items\s*:/i.test(cssNoComments), '.page-header uses align-items for centering');

// Footer layout
assert(/\.page-footer\s*\{[^}]*display\s*:\s*flex/i.test(cssNoComments), '.page-footer uses display: flex');

console.log(`\n${passed} passed, ${failed} failed out of ${passed + failed} tests`);
process.exit(failed > 0 ? 1 : 0);
