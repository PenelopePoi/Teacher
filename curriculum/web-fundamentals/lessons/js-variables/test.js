/**
 * Tests for Variables & Data Types
 *
 * Validates variable declarations, data types, and template literal usage.
 * Run with: node test.js
 */
const mod = require('./script.js');

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

console.log('Testing: Variables & Data Types\n');

// Variable existence and types
assert(typeof mod.EVENT_NAME === 'string' && mod.EVENT_NAME.length > 0,
    'EVENT_NAME is a non-empty string');

assert(typeof mod.MAX_ATTENDEES === 'number' && mod.MAX_ATTENDEES > 0,
    'MAX_ATTENDEES is a positive number');

assert(typeof mod.currentAttendees === 'number',
    'currentAttendees is a number');

assert(typeof mod.IS_FREE === 'boolean',
    'IS_FREE is a boolean');

// Array
assert(Array.isArray(mod.EVENT_TAGS), 'EVENT_TAGS is an array');
assert(mod.EVENT_TAGS && mod.EVENT_TAGS.length >= 3,
    'EVENT_TAGS has at least 3 items');
assert(mod.EVENT_TAGS && mod.EVENT_TAGS.every(t => typeof t === 'string'),
    'All EVENT_TAGS items are strings');

// Object
assert(typeof mod.EVENT_DETAILS === 'object' && mod.EVENT_DETAILS !== null,
    'EVENT_DETAILS is an object');
if (mod.EVENT_DETAILS) {
    assert('name' in mod.EVENT_DETAILS, 'EVENT_DETAILS has a name property');
    assert('date' in mod.EVENT_DETAILS, 'EVENT_DETAILS has a date property');
    assert('location' in mod.EVENT_DETAILS, 'EVENT_DETAILS has a location property');
    assert(mod.EVENT_DETAILS.name === mod.EVENT_NAME,
        'EVENT_DETAILS.name references EVENT_NAME variable');
    assert(mod.EVENT_DETAILS.maxAttendees === mod.MAX_ATTENDEES,
        'EVENT_DETAILS.maxAttendees references MAX_ATTENDEES variable');
}

// Template literal function
const summary = mod.getEventSummary();
assert(typeof summary === 'string' && summary.length > 0,
    'getEventSummary() returns a non-empty string');
assert(summary && summary.includes(mod.EVENT_NAME),
    'Summary includes the event name (using template literal, not hardcoded)');
assert(summary && summary.includes(String(mod.MAX_ATTENDEES)),
    'Summary includes the max attendees count');

// Registration function
const initialCount = mod.currentAttendees;
const afterRegister = mod.registerAttendee();
assert(typeof afterRegister === 'number', 'registerAttendee() returns a number');
assert(afterRegister === initialCount + 1,
    'registerAttendee() increments currentAttendees and returns new count');

// No var usage check (read source file)
const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf-8');
const sourceNoComments = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
const hasVar = /\bvar\s+/g.test(sourceNoComments);
assert(!hasVar, 'No var keyword used (only let and const)');

console.log(`\n${passed} passed, ${failed} failed out of ${passed + failed} tests`);
process.exit(failed > 0 ? 1 : 0);
