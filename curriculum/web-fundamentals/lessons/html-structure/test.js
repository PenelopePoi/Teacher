/**
 * Tests for Building a Page Structure
 *
 * Validates that the student created a proper HTML5 document
 * with semantic structure. Run with: node test.js
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const lower = html.toLowerCase();

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

console.log('Testing: Building a Page Structure\n');

// DOCTYPE
assert(lower.includes('<!doctype html>'), 'Page has <!DOCTYPE html> declaration');

// Core structure
assert(/<html[^>]*lang\s*=\s*["']en["']/i.test(html), '<html> tag has lang="en" attribute');
assert(lower.includes('<head>') || lower.includes('<head '), 'Page contains a <head> element');
assert(lower.includes('<body>') || lower.includes('<body '), 'Page contains a <body> element');

// Head contents
assert(/<meta[^>]*charset\s*=\s*["']utf-8["']/i.test(html), 'Head includes <meta charset="UTF-8">');
assert(/<title>[^<]+<\/title>/i.test(html), 'Head includes a <title> with text content');

// Semantic elements
assert(/<header[\s>]/i.test(html) && /<\/header>/i.test(html), 'Page uses a <header> element');
assert(/<main[\s>]/i.test(html) && /<\/main>/i.test(html), 'Page uses a <main> element');
assert(/<footer[\s>]/i.test(html) && /<\/footer>/i.test(html), 'Page uses a <footer> element');

// Content checks
assert(/<h1>[^<]+<\/h1>/i.test(html), 'Header contains an <h1> with content');
assert(/<nav[\s>]/i.test(html), 'Header contains a <nav> element');
assert(/<section[^>]*id\s*=\s*["']about["']/i.test(html), 'Main contains a section with id="about"');
assert(/<h2>[^<]+<\/h2>/i.test(html), 'Sections use <h2> headings');

// Closing tags
assert(lower.includes('</body>'), 'Body tag is properly closed');
assert(lower.includes('</html>'), 'HTML tag is properly closed');

console.log(`\n${passed} passed, ${failed} failed out of ${passed + failed} tests`);
process.exit(failed > 0 ? 1 : 0);
