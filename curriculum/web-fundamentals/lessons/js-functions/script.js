/**
 * Functions That Do Real Work
 *
 * You're building utility functions for a freelancer's invoicing tool.
 * Freelancers — designers, developers, consultants — need to calculate
 * rates, format currency, and generate invoice summaries. These functions
 * handle the math so the freelancer can focus on the craft.
 *
 * Complete the TODOs below.
 */

// TODO: Write a function called calculateTotal that takes:
//   - hours (number): hours worked
//   - rate (number): hourly rate in dollars
//   - taxRate (number, default 0.07): tax as a decimal (7% = 0.07)
// Returns the total including tax. Formula: (hours * rate) * (1 + taxRate)
// Use a function declaration (not arrow function) for this one.


// TODO: Write an arrow function called formatCurrency that takes:
//   - amount (number): the dollar amount
//   - currency (string, default 'USD'): the currency code
// Returns a formatted string like "$1,234.56 USD"
// Hint: use toFixed(2) for decimals and toLocaleString() for commas


// TODO: Write a function called createLineItem that takes:
//   - description (string): what the work was
//   - hours (number): hours spent
//   - rate (number): hourly rate
// Returns an object with: { description, hours, rate, subtotal }
// where subtotal = hours * rate


// TODO: Write an arrow function called generateInvoiceSummary that takes:
//   - clientName (string): who the invoice is for
//   - lineItems (array): array of line item objects (from createLineItem)
//   - taxRate (number, default 0.07): tax rate
// Returns an object with:
//   - client: the client name
//   - items: the line items array
//   - subtotal: sum of all line item subtotals
//   - tax: subtotal * taxRate
//   - total: subtotal + tax
//   - summary: a template literal string like:
//     "Invoice for Acme Corp: 3 items, $1,234.56 total"


// TODO: Write an arrow function called isOverBudget that takes:
//   - lineItems (array): array of line item objects
//   - budget (number): the client's budget
// Returns true if the sum of all subtotals exceeds the budget, false otherwise


// Exports for testing — don't modify this
if (typeof module !== 'undefined') {
    module.exports = {
        calculateTotal: typeof calculateTotal !== 'undefined' ? calculateTotal : undefined,
        formatCurrency: typeof formatCurrency !== 'undefined' ? formatCurrency : undefined,
        createLineItem: typeof createLineItem !== 'undefined' ? createLineItem : undefined,
        generateInvoiceSummary: typeof generateInvoiceSummary !== 'undefined' ? generateInvoiceSummary : undefined,
        isOverBudget: typeof isOverBudget !== 'undefined' ? isOverBudget : undefined
    };
}
