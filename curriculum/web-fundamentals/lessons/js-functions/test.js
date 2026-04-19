/**
 * Tests for Functions That Do Real Work
 *
 * Validates function declarations, arrow functions, defaults, and logic.
 * Run with: node test.js
 */
const fs = require('fs');
const path = require('path');
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

console.log('Testing: Functions That Do Real Work\n');

// Check function existence
assert(typeof mod.calculateTotal === 'function', 'calculateTotal is defined as a function');
assert(typeof mod.formatCurrency === 'function', 'formatCurrency is defined as a function');
assert(typeof mod.createLineItem === 'function', 'createLineItem is defined as a function');
assert(typeof mod.generateInvoiceSummary === 'function', 'generateInvoiceSummary is defined as a function');
assert(typeof mod.isOverBudget === 'function', 'isOverBudget is defined as a function');

// calculateTotal
if (mod.calculateTotal) {
    const total = mod.calculateTotal(10, 50);
    assert(Math.abs(total - 535) < 0.01, 'calculateTotal(10, 50) with default 7% tax = $535.00');

    const totalCustomTax = mod.calculateTotal(8, 75, 0.10);
    assert(Math.abs(totalCustomTax - 660) < 0.01, 'calculateTotal(8, 75, 0.10) with 10% tax = $660.00');

    const totalNoTax = mod.calculateTotal(5, 100, 0);
    assert(Math.abs(totalNoTax - 500) < 0.01, 'calculateTotal(5, 100, 0) with 0% tax = $500.00');
}

// formatCurrency
if (mod.formatCurrency) {
    const formatted = mod.formatCurrency(1234.5);
    assert(typeof formatted === 'string', 'formatCurrency returns a string');
    assert(formatted.includes('1,234.50') || formatted.includes('1234.50'),
        'formatCurrency(1234.5) formats to two decimal places');
    assert(formatted.includes('USD'), 'formatCurrency uses default USD currency');

    const euro = mod.formatCurrency(99.9, 'EUR');
    assert(euro.includes('EUR'), 'formatCurrency(99.9, "EUR") uses EUR currency code');
}

// createLineItem
if (mod.createLineItem) {
    const item = mod.createLineItem('Logo Design', 12, 85);
    assert(typeof item === 'object' && item !== null, 'createLineItem returns an object');
    assert(item.description === 'Logo Design', 'Line item has correct description');
    assert(item.hours === 12, 'Line item has correct hours');
    assert(item.rate === 85, 'Line item has correct rate');
    assert(item.subtotal === 1020, 'Line item subtotal is hours * rate (1020)');
}

// generateInvoiceSummary
if (mod.generateInvoiceSummary && mod.createLineItem) {
    const items = [
        mod.createLineItem('Brand Strategy', 5, 100),
        mod.createLineItem('Logo Design', 10, 85),
        mod.createLineItem('Style Guide', 3, 90)
    ];
    const invoice = mod.generateInvoiceSummary('Acme Corp', items);
    assert(typeof invoice === 'object', 'generateInvoiceSummary returns an object');
    assert(invoice.client === 'Acme Corp', 'Invoice has correct client name');
    assert(invoice.items.length === 3, 'Invoice has 3 line items');
    const expectedSubtotal = 500 + 850 + 270;
    assert(Math.abs(invoice.subtotal - expectedSubtotal) < 0.01,
        `Invoice subtotal is correct ($${expectedSubtotal})`);
    assert(Math.abs(invoice.tax - expectedSubtotal * 0.07) < 0.01,
        'Invoice tax calculated with default 7% rate');
    assert(Math.abs(invoice.total - (expectedSubtotal * 1.07)) < 0.01,
        'Invoice total = subtotal + tax');
    assert(typeof invoice.summary === 'string' && invoice.summary.length > 0,
        'Invoice includes a summary string');
    assert(invoice.summary.includes('Acme Corp'),
        'Invoice summary mentions the client name');
}

// isOverBudget
if (mod.isOverBudget && mod.createLineItem) {
    const items = [
        mod.createLineItem('Work A', 10, 100),
        mod.createLineItem('Work B', 5, 80)
    ];
    assert(mod.isOverBudget(items, 1000) === true,
        'isOverBudget returns true when total ($1400) exceeds budget ($1000)');
    assert(mod.isOverBudget(items, 2000) === false,
        'isOverBudget returns false when total ($1400) is under budget ($2000)');
}

// Source analysis: check for arrow functions and function declarations
const source = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf-8');
const sourceNoComments = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
assert(/\bfunction\s+\w+\s*\(/.test(sourceNoComments),
    'At least one function declaration is used');
assert(/=>\s*[\{\(]|=>\s*[^;]+;/.test(sourceNoComments),
    'At least one arrow function is used');
assert(/=\s*[\d.]+\s*\)/.test(sourceNoComments) || /=\s*['"][^'"]*['"]\s*\)/.test(sourceNoComments),
    'At least one default parameter value is used');

console.log(`\n${passed} passed, ${failed} failed out of ${passed + failed} tests`);
process.exit(failed > 0 ? 1 : 0);
