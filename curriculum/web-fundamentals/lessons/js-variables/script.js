/**
 * Variables & Data Types
 *
 * You're building the data layer for a community event tracker.
 * Before you can display events on a page, you need to model them
 * in code. Variables are how programs remember things.
 *
 * Complete the TODOs below and export your work.
 */

// TODO: Declare a constant called EVENT_NAME with the name of a community event
// (use const because the event name won't change once set)

// TODO: Declare a constant called MAX_ATTENDEES with a number (e.g., 50)

// TODO: Declare a variable called currentAttendees using let, starting at 0
// (use let because this number will change as people register)

// TODO: Declare a constant called IS_FREE as a boolean (true or false)

// TODO: Create a constant called EVENT_TAGS as an array with at least 3 strings
// describing the event (e.g., ['outdoor', 'family-friendly', 'music'])

// TODO: Create a constant called EVENT_DETAILS as an object with these properties:
//   - name: use the EVENT_NAME variable
//   - date: a string like '2026-06-15'
//   - location: a string with a real place name
//   - maxAttendees: use the MAX_ATTENDEES variable
//   - isFree: use the IS_FREE variable
//   - tags: use the EVENT_TAGS variable

// TODO: Create a function called getEventSummary that takes no arguments and
// returns a string using a template literal. It should read like:
// "Community BBQ on 2026-06-15 at Riverside Park (50 spots, free admission)"
// Use the variables you created above — don't hardcode the values.
function getEventSummary() {
    // TODO: Return a template literal string using your variables
}

// TODO: Write a function called registerAttendee that:
//   1. Checks if currentAttendees < MAX_ATTENDEES
//   2. If yes, increments currentAttendees by 1 and returns the new count
//   3. If no, returns -1 to indicate the event is full
function registerAttendee() {
    // TODO: Implement registration logic
}

// Exports for testing — don't modify this
if (typeof module !== 'undefined') {
    module.exports = {
        EVENT_NAME: typeof EVENT_NAME !== 'undefined' ? EVENT_NAME : undefined,
        MAX_ATTENDEES: typeof MAX_ATTENDEES !== 'undefined' ? MAX_ATTENDEES : undefined,
        get currentAttendees() { return typeof currentAttendees !== 'undefined' ? currentAttendees : undefined; },
        IS_FREE: typeof IS_FREE !== 'undefined' ? IS_FREE : undefined,
        EVENT_TAGS: typeof EVENT_TAGS !== 'undefined' ? EVENT_TAGS : undefined,
        EVENT_DETAILS: typeof EVENT_DETAILS !== 'undefined' ? EVENT_DETAILS : undefined,
        getEventSummary,
        registerAttendee
    };
}
