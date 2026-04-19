/**
 * Tests for Headings, Paragraphs & Lists
 *
 * Validates proper use of content hierarchy, text elements, and lists.
 * Run with: node test.js
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

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

console.log('Testing: Headings, Paragraphs & Lists\n');

// Heading hierarchy
assert(/<h1>[^<]+<\/h1>/i.test(html), 'Page has an <h1> heading');
const h2Matches = html.match(/<h2>[^<]+<\/h2>/gi);
assert(h2Matches && h2Matches.length >= 2, 'Page has at least 2 <h2> headings');
assert(/<h3>[^<]+<\/h3>/i.test(html), 'Page has at least one <h3> heading');

// Paragraphs
const pMatches = html.match(/<p>[\s\S]*?<\/p>/gi);
assert(pMatches && pMatches.length >= 3, 'Page contains at least 3 paragraphs');

// Inline emphasis
assert(/<strong>[^<]+<\/strong>/i.test(html), 'Content uses <strong> for important text');
assert(/<em>[^<]+<\/em>/i.test(html), 'Content uses <em> for emphasized text');

// Ordered list
assert(/<ol[\s>]/i.test(html), 'Page contains an ordered list (<ol>)');
const olMatch = html.match(/<ol[\s\S]*?<\/ol>/i);
if (olMatch) {
    const olItems = olMatch[0].match(/<li>/gi);
    assert(olItems && olItems.length >= 3, 'Ordered list has at least 3 items');
} else {
    assert(false, 'Ordered list has at least 3 items');
}

// Unordered list
assert(/<ul[\s>]/i.test(html), 'Page contains an unordered list (<ul>)');
const ulMatch = html.match(/<ul[\s\S]*?<\/ul>/i);
if (ulMatch) {
    const ulItems = ulMatch[0].match(/<li>/gi);
    assert(ulItems && ulItems.length >= 3, 'Unordered list has at least 3 items');
} else {
    assert(false, 'Unordered list has at least 3 items');
}

console.log(`\n${passed} passed, ${failed} failed out of ${passed + failed} tests`);
process.exit(failed > 0 ? 1 : 0);
