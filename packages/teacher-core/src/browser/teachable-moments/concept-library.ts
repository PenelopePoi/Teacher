/**
 * C9 — Teachable Moments: Built-in Concept Library
 *
 * The pedagogy primitive that survives 100 years.
 * 50+ concepts across 12 categories, each with meaningful
 * playground code that teaches something real.
 *
 * No "Hello World". No "foo/bar". Every example serves human purpose.
 */

export interface ConceptDefinition {
    readonly id: string;
    readonly name: string;
    readonly category: ConceptCategory;
    readonly oneLineExplanation: string;
    readonly fullExplanation: string;
    readonly playgroundCode?: string;
    readonly keywords: readonly string[];
}

export type ConceptCategory =
    | 'Variables'
    | 'Functions'
    | 'Control Flow'
    | 'Data Structures'
    | 'OOP'
    | 'Async'
    | 'DOM/Web'
    | 'CSS'
    | 'Git'
    | 'Algorithms'
    | 'Design Patterns'
    | 'Testing'
    | 'Audio';

export const CATEGORY_COLORS: Record<ConceptCategory, string> = {
    'Variables': '#60A5FA',
    'Functions': '#A78BFA',
    'Control Flow': '#F472B6',
    'Data Structures': '#34D399',
    'OOP': '#FB923C',
    'Async': '#FBBF24',
    'DOM/Web': '#38BDF8',
    'CSS': '#E879F9',
    'Git': '#F87171',
    'Algorithms': '#2DD4BF',
    'Design Patterns': '#818CF8',
    'Testing': '#4ADE80',
    'Audio': '#E8A948',
};

export const CONCEPT_LIBRARY: readonly ConceptDefinition[] = [
    // ─── Variables ───
    {
        id: 'const-let',
        name: 'const vs let',
        category: 'Variables',
        oneLineExplanation: 'const binds a name once; let allows rebinding.',
        fullExplanation: 'Use const by default for values that should not be reassigned. Use let only when the binding must change (loop counters, accumulators). This communicates intent to future readers and prevents accidental mutation bugs.',
        playgroundCode: `// const prevents reassignment — the binding is permanent
const TAX_RATE = 0.0825;
// TAX_RATE = 0.09; // TypeError!

// let allows reassignment — the binding can change
let total = 100;
total = total + (total * TAX_RATE);
console.log('Total with tax:', total.toFixed(2));

// Important: const does NOT mean immutable for objects
const cart = ['apples', 'bread'];
cart.push('milk'); // This works — the array contents change, not the binding
console.log('Cart:', cart);`,
        keywords: ['const', 'let', 'var', 'declaration', 'variable'],
    },
    {
        id: 'destructuring',
        name: 'Destructuring',
        category: 'Variables',
        oneLineExplanation: 'Unpack values from arrays or properties from objects into distinct variables.',
        fullExplanation: 'Destructuring lets you extract multiple values in a single statement, reducing boilerplate and making your intent clearer. It works on arrays (positional) and objects (by name). You can set defaults, rename bindings, and nest patterns.',
        playgroundCode: `// Object destructuring — pull out what you need
const patient = { name: 'Maria', age: 34, bloodType: 'O+', allergies: ['penicillin'] };
const { name, bloodType, allergies = [] } = patient;
console.log(name, 'is', bloodType, 'with allergies:', allergies);

// Array destructuring — positional extraction
const rgb = [64, 128, 255];
const [red, green, blue] = rgb;
console.log('Red channel:', red);

// Swap without a temp variable
let a = 'first';
let b = 'second';
[a, b] = [b, a];
console.log('Swapped:', a, b);

// Nested destructuring
const response = { data: { user: { id: 42, role: 'admin' } } };
const { data: { user: { role } } } = response;
console.log('Role:', role);`,
        keywords: ['destructuring', 'destructure', 'unpack', 'spread'],
    },
    {
        id: 'template-literals',
        name: 'Template Literals',
        category: 'Variables',
        oneLineExplanation: 'Backtick strings with embedded expressions and multi-line support.',
        fullExplanation: 'Template literals use backticks instead of quotes, allowing embedded expressions via ${} and natural multi-line strings. Tagged templates let you process the string pieces with a custom function for sanitization, localization, or DSLs.',
        playgroundCode: `const student = { name: 'Alex', grade: 'A', subject: 'Algorithms' };

// Expression interpolation
console.log(\`\${student.name} earned a \${student.grade} in \${student.subject}\`);

// Multi-line (preserves whitespace)
const report = \`
  Student: \${student.name}
  Grade:   \${student.grade}
  Subject: \${student.subject}
\`;
console.log(report);

// Tagged template for safe HTML
function safeHtml(strings, ...values) {
    return strings.reduce((result, str, i) => {
        const val = values[i - 1];
        const escaped = String(val).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return result + escaped + str;
    });
}
const userInput = '<script>alert("xss")</script>';
console.log(safeHtml\`User said: \${userInput}\`);`,
        keywords: ['template literal', 'template string', 'backtick', 'interpolation'],
    },
    {
        id: 'spread-operator',
        name: 'Spread Operator',
        category: 'Variables',
        oneLineExplanation: 'Expand an iterable into individual elements or merge objects.',
        fullExplanation: 'The spread operator (...) copies elements from arrays or properties from objects into a new container. It creates shallow copies, which is essential for immutable update patterns in state management.',
        playgroundCode: `// Merge arrays without mutation
const medications = ['ibuprofen', 'acetaminophen'];
const supplements = ['vitamin D', 'iron'];
const allMeds = [...medications, ...supplements];
console.log('All:', allMeds);

// Shallow clone + override (immutable update pattern)
const config = { theme: 'dark', fontSize: 14, lang: 'en' };
const updated = { ...config, fontSize: 16 };
console.log('Original:', config.fontSize); // still 14
console.log('Updated:', updated.fontSize); // 16

// Rest parameters — collect remaining args
function logFirst(first, ...rest) {
    console.log('First:', first);
    console.log('Rest:', rest);
}
logFirst('alpha', 'beta', 'gamma', 'delta');`,
        keywords: ['spread', 'rest', '...', 'ellipsis'],
    },

    // ─── Functions ───
    {
        id: 'closure',
        name: 'Closure',
        category: 'Functions',
        oneLineExplanation: 'A function that remembers the variables from the scope where it was created.',
        fullExplanation: 'When a function is defined inside another function, it captures (closes over) the outer variables. This creates private state — the inner function can read and modify those variables even after the outer function returns. Closures are the foundation of modules, factories, and data privacy in JavaScript.',
        playgroundCode: `// Counter factory — each counter has its own private state
function createCounter(initialValue = 0) {
    let count = initialValue;
    return {
        increment() { return ++count; },
        decrement() { return --count; },
        value() { return count; },
    };
}

const pageViews = createCounter();
pageViews.increment();
pageViews.increment();
pageViews.increment();
console.log('Page views:', pageViews.value()); // 3

const downloads = createCounter(100);
downloads.decrement();
console.log('Downloads remaining:', downloads.value()); // 99

// The counts are completely independent — true encapsulation
console.log('Page views still:', pageViews.value()); // 3`,
        keywords: ['closure', 'closures', 'lexical scope', 'encapsulation'],
    },
    {
        id: 'higher-order-function',
        name: 'Higher-Order Function',
        category: 'Functions',
        oneLineExplanation: 'A function that takes a function as an argument or returns one.',
        fullExplanation: 'Higher-order functions let you abstract over actions, not just values. map, filter, and reduce are classic examples. Writing your own HOFs enables powerful composition patterns — middleware chains, event handlers, validation pipelines.',
        playgroundCode: `// Build a reusable validator pipeline
function createValidator(...rules) {
    return function validate(value) {
        const errors = [];
        for (const rule of rules) {
            const error = rule(value);
            if (error) { errors.push(error); }
        }
        return { valid: errors.length === 0, errors };
    };
}

const required = v => v ? undefined : 'Required';
const minLength = n => v => v && v.length >= n ? undefined : \`Must be at least \${n} chars\`;
const hasNumber = v => /\\d/.test(v) ? undefined : 'Must contain a number';

const validatePassword = createValidator(required, minLength(8), hasNumber);

console.log(validatePassword('hello'));     // { valid: false, errors: [...] }
console.log(validatePassword('secure99!'));  // { valid: true, errors: [] }`,
        keywords: ['higher-order', 'higher order', 'hof', 'callback', 'map', 'filter', 'reduce'],
    },
    {
        id: 'arrow-function',
        name: 'Arrow Function',
        category: 'Functions',
        oneLineExplanation: 'Concise function syntax that inherits `this` from the enclosing scope.',
        fullExplanation: 'Arrow functions (=>) provide shorter syntax and, crucially, do not have their own `this` binding. They inherit `this` lexically from where they are defined, which eliminates a whole class of bugs in callbacks and event handlers.',
        playgroundCode: `// Traditional vs arrow — syntax comparison
const numbers = [1, 4, 9, 16, 25];

// Arrow: implicit return for single expressions
const roots = numbers.map(n => Math.sqrt(n));
console.log('Square roots:', roots);

// Arrow: block body when you need multiple statements
const analyze = numbers.map(n => {
    const root = Math.sqrt(n);
    const isWhole = root === Math.floor(root);
    return { value: n, root: root.toFixed(2), perfect: isWhole };
});
console.log('Analysis:', analyze);

// The real win: lexical 'this'
class Timer {
    seconds = 0;
    start() {
        // Arrow inherits 'this' from start() — no .bind() needed
        setInterval(() => {
            this.seconds++;
        }, 1000);
    }
}`,
        keywords: ['arrow function', '=>', 'fat arrow', 'lambda'],
    },
    {
        id: 'pure-function',
        name: 'Pure Function',
        category: 'Functions',
        oneLineExplanation: 'A function whose output depends only on its inputs and causes no side effects.',
        fullExplanation: 'Pure functions always return the same result for the same arguments and modify nothing outside themselves. They are easy to test, cache, and parallelize. Most bugs come from impure code, so pushing logic into pure functions makes systems more reliable.',
        playgroundCode: `// Pure: same input always gives same output, no side effects
function calculateTip(subtotal, tipPercent) {
    return subtotal * (tipPercent / 100);
}

console.log(calculateTip(50, 20)); // Always 10
console.log(calculateTip(50, 20)); // Always 10

// Pure: transforms data without mutation
function addItem(cart, item) {
    return [...cart, item]; // new array, original untouched
}

const cart1 = ['coffee'];
const cart2 = addItem(cart1, 'muffin');
console.log('Original:', cart1); // ['coffee'] — unchanged
console.log('Updated:', cart2);  // ['coffee', 'muffin']

// Impure (for comparison): modifies external state
let callCount = 0;
function impureAdd(a, b) {
    callCount++; // side effect!
    return a + b;
}`,
        keywords: ['pure function', 'pure', 'side effect', 'referential transparency'],
    },

    // ─── Control Flow ───
    {
        id: 'ternary',
        name: 'Ternary Operator',
        category: 'Control Flow',
        oneLineExplanation: 'Inline conditional: condition ? valueIfTrue : valueIfFalse.',
        fullExplanation: 'The ternary operator is an expression (it produces a value), unlike if/else which is a statement. This makes it ideal for JSX rendering, variable assignment, and function arguments. Keep it simple — nest ternaries only when the logic is trivially clear.',
        playgroundCode: `const temperature = 72;
const comfort = temperature > 80 ? 'too hot'
    : temperature < 60 ? 'too cold'
    : 'just right';
console.log('Comfort level:', comfort);

// Common in React-style rendering
const isLoggedIn = true;
const greeting = isLoggedIn ? 'Welcome back!' : 'Please sign in';
console.log(greeting);

// Ternary for default values (before nullish coalescing existed)
const userTheme = undefined;
const theme = userTheme ? userTheme : 'dark';
console.log('Theme:', theme);`,
        keywords: ['ternary', '?:', 'conditional operator', 'inline if'],
    },
    {
        id: 'optional-chaining',
        name: 'Optional Chaining',
        category: 'Control Flow',
        oneLineExplanation: 'Access nested properties safely with ?. — returns undefined instead of throwing.',
        fullExplanation: 'Optional chaining (?.) short-circuits to undefined if any link in the property chain is null or undefined. It replaces verbose guard checks and reduces the chance of "Cannot read property of undefined" errors, the most common JavaScript runtime error.',
        playgroundCode: `const user = {
    name: 'Alex',
    address: {
        city: 'Orlando',
        zip: '32801',
    },
    // no 'phone' property
};

// Without optional chaining — verbose and fragile
const phone1 = user && user.phone && user.phone.mobile;

// With optional chaining — clean and safe
const phone2 = user?.phone?.mobile;
console.log('Phone:', phone2); // undefined, no error

// Works with methods too
const uppercased = user?.name?.toUpperCase();
console.log('Name:', uppercased); // 'ALEX'

// Combined with nullish coalescing for defaults
const city = user?.address?.city ?? 'Unknown';
console.log('City:', city); // 'Orlando'

// Works with arrays
const users = [{ name: 'Alex' }];
console.log(users?.[0]?.name); // 'Alex'
console.log(users?.[5]?.name); // undefined`,
        keywords: ['optional chaining', '?.', 'safe navigation', 'null safety'],
    },
    {
        id: 'nullish-coalescing',
        name: 'Nullish Coalescing',
        category: 'Control Flow',
        oneLineExplanation: 'a ?? b returns b only when a is null or undefined, not when a is 0 or empty string.',
        fullExplanation: 'Unlike the logical OR (||) which treats 0, empty strings, and false as falsy, the nullish coalescing operator (??) only falls through on null or undefined. This is critical when 0 or empty string are valid values you want to keep.',
        playgroundCode: `// The problem with || for defaults
const volume = 0;
console.log(volume || 50);  // 50 — wrong! 0 is a valid volume
console.log(volume ?? 50);  // 0  — correct! only null/undefined trigger fallback

const username = '';
console.log(username || 'Anonymous');  // 'Anonymous' — wrong if empty string is intentional
console.log(username ?? 'Anonymous');  // '' — correct!

// Perfect for configuration merging
function configure(options) {
    const config = {
        retries: options.retries ?? 3,
        timeout: options.timeout ?? 5000,
        verbose: options.verbose ?? false,
    };
    return config;
}

console.log(configure({ retries: 0, timeout: 1000 }));
// { retries: 0, timeout: 1000, verbose: false }`,
        keywords: ['nullish coalescing', '??', 'null', 'undefined', 'default'],
    },

    // ─── Data Structures ───
    {
        id: 'map-object',
        name: 'Map vs Object',
        category: 'Data Structures',
        oneLineExplanation: 'Map is a key-value collection that preserves insertion order and allows any key type.',
        fullExplanation: 'While plain objects work as dictionaries, Map is purpose-built for key-value storage. Maps accept any key type (objects, functions, numbers), guarantee insertion order, have a .size property, and perform better for frequent additions/deletions.',
        playgroundCode: `// Map allows any key type, not just strings
const permissions = new Map();
const adminRole = { name: 'admin' };
const userRole = { name: 'user' };

permissions.set(adminRole, ['read', 'write', 'delete']);
permissions.set(userRole, ['read']);

console.log('Admin can:', permissions.get(adminRole));
console.log('Total roles:', permissions.size);

// Iteration preserves insertion order
for (const [role, perms] of permissions) {
    console.log(role.name, '->', perms.join(', '));
}

// Map from entries and back
const priceMap = new Map([['coffee', 4.50], ['tea', 3.00], ['water', 1.50]]);
const priceObject = Object.fromEntries(priceMap);
console.log('As object:', priceObject);`,
        keywords: ['Map', 'map', 'dictionary', 'hash map', 'key-value'],
    },
    {
        id: 'set',
        name: 'Set',
        category: 'Data Structures',
        oneLineExplanation: 'A collection of unique values with fast lookup.',
        fullExplanation: 'Set stores only unique values and provides O(1) lookup via .has(). It is ideal for deduplication, membership testing, and computing intersections or unions. Unlike arrays, Set.has() does not scan the entire collection.',
        playgroundCode: `// Deduplicate an array
const rawTags = ['javascript', 'react', 'javascript', 'css', 'react', 'html'];
const uniqueTags = [...new Set(rawTags)];
console.log('Unique tags:', uniqueTags);

// Fast membership testing
const allowedOrigins = new Set(['localhost', 'example.com', 'api.example.com']);
console.log('Allowed?', allowedOrigins.has('localhost'));     // true
console.log('Allowed?', allowedOrigins.has('malicious.com')); // false

// Set operations
const frontend = new Set(['html', 'css', 'javascript', 'react']);
const backend = new Set(['python', 'javascript', 'sql', 'docker']);

const intersection = new Set([...frontend].filter(x => backend.has(x)));
const union = new Set([...frontend, ...backend]);
console.log('Both:', [...intersection]); // ['javascript']
console.log('All:', [...union]);`,
        keywords: ['Set', 'set', 'unique', 'deduplicate', 'membership'],
    },
    {
        id: 'array-methods',
        name: 'Array Methods',
        category: 'Data Structures',
        oneLineExplanation: 'map, filter, reduce, find, some, every — functional array transformations.',
        fullExplanation: 'Functional array methods let you transform data declaratively. map transforms each element, filter selects elements, reduce accumulates a result, find locates a single match, some/every test conditions. They chain naturally and avoid mutation.',
        playgroundCode: `const students = [
    { name: 'Maria', grade: 92, subject: 'math' },
    { name: 'James', grade: 78, subject: 'science' },
    { name: 'Aisha', grade: 95, subject: 'math' },
    { name: 'Carlos', grade: 65, subject: 'english' },
    { name: 'Priya', grade: 88, subject: 'science' },
];

// Chain: filter -> map -> sort
const honorRoll = students
    .filter(s => s.grade >= 85)
    .map(s => \`\${s.name} (\${s.grade})\`)
    .sort();
console.log('Honor roll:', honorRoll);

// reduce: group by subject
const bySubject = students.reduce((groups, s) => {
    (groups[s.subject] ??= []).push(s.name);
    return groups;
}, {});
console.log('By subject:', bySubject);

// find + some + every
console.log('First math student:', students.find(s => s.subject === 'math')?.name);
console.log('Anyone failing?', students.some(s => s.grade < 70));
console.log('All passing?', students.every(s => s.grade >= 60));`,
        keywords: ['map', 'filter', 'reduce', 'find', 'some', 'every', 'forEach', 'array method'],
    },
    {
        id: 'linked-list',
        name: 'Linked List',
        category: 'Data Structures',
        oneLineExplanation: 'A sequence of nodes where each node points to the next.',
        fullExplanation: 'Unlike arrays, linked lists do not store elements contiguously. Each node holds a value and a reference to the next node. Insertion and deletion at known positions are O(1), but random access is O(n). Understanding linked lists teaches pointer-based thinking.',
        playgroundCode: `class ListNode {
    constructor(value, next = null) {
        this.value = value;
        this.next = next;
    }
}

class LinkedList {
    constructor() { this.head = null; }

    prepend(value) {
        this.head = new ListNode(value, this.head);
    }

    toArray() {
        const result = [];
        let current = this.head;
        while (current) {
            result.push(current.value);
            current = current.next;
        }
        return result;
    }

    reverse() {
        let prev = null, current = this.head;
        while (current) {
            const next = current.next;
            current.next = prev;
            prev = current;
            current = next;
        }
        this.head = prev;
    }
}

const list = new LinkedList();
list.prepend('first');
list.prepend('second');
list.prepend('third');
console.log('Forward:', list.toArray());
list.reverse();
console.log('Reversed:', list.toArray());`,
        keywords: ['linked list', 'node', 'pointer', 'singly linked'],
    },

    // ─── OOP ───
    {
        id: 'class-inheritance',
        name: 'Class Inheritance',
        category: 'OOP',
        oneLineExplanation: 'Classes can extend other classes, inheriting methods and adding specialization.',
        fullExplanation: 'JavaScript classes use prototypal inheritance under the hood. The extends keyword creates a parent-child relationship. The child class inherits all methods and can override them. Always call super() in the constructor before using this.',
        playgroundCode: `class Shape {
    constructor(color) { this.color = color; }
    describe() { return \`A \${this.color} shape\`; }
    area() { throw new Error('Subclass must implement area()'); }
}

class Circle extends Shape {
    constructor(color, radius) {
        super(color); // must call super first
        this.radius = radius;
    }
    area() { return Math.PI * this.radius ** 2; }
    describe() { return \`\${super.describe()} (circle, r=\${this.radius})\`; }
}

class Rectangle extends Shape {
    constructor(color, width, height) {
        super(color);
        this.width = width;
        this.height = height;
    }
    area() { return this.width * this.height; }
}

const shapes = [new Circle('red', 5), new Rectangle('blue', 4, 6)];
for (const s of shapes) {
    console.log(s.describe(), '— area:', s.area().toFixed(2));
}`,
        keywords: ['class', 'extends', 'super', 'inheritance', 'prototype'],
    },
    {
        id: 'interface-pattern',
        name: 'Interface (TypeScript)',
        category: 'OOP',
        oneLineExplanation: 'A contract that describes the shape an object must have.',
        fullExplanation: 'Interfaces define structure without implementation. They enable duck typing — any object matching the shape satisfies the interface. Use interfaces to decouple modules: code depends on the shape, not a specific class.',
        playgroundCode: `// In TypeScript — interfaces define contracts
interface Storable {
    id: string;
    serialize(): string;
    deserialize(data: string): void;
}

// Any class can implement the interface
class UserProfile implements Storable {
    id: string;
    name: string;
    email: string;

    constructor(id: string, name: string, email: string) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    serialize(): string {
        return JSON.stringify({ id: this.id, name: this.name, email: this.email });
    }

    deserialize(data: string): void {
        const parsed = JSON.parse(data);
        Object.assign(this, parsed);
    }
}

// Functions depend on the interface, not the class
function save(item: Storable): void {
    console.log(\`Saving \${item.id}: \${item.serialize()}\`);
}`,
        keywords: ['interface', 'contract', 'implements', 'shape', 'duck typing'],
    },
    {
        id: 'encapsulation',
        name: 'Encapsulation',
        category: 'OOP',
        oneLineExplanation: 'Hide internal state and expose only a controlled public API.',
        fullExplanation: 'Encapsulation protects internal data from unauthorized access. JavaScript uses # for truly private fields. The public API (methods) acts as a controlled gateway. This prevents invalid states and lets you change internals without breaking consumers.',
        playgroundCode: `class BankAccount {
    #balance; // truly private — inaccessible outside the class
    #transactions;

    constructor(initialBalance) {
        this.#balance = initialBalance;
        this.#transactions = [];
    }

    deposit(amount) {
        if (amount <= 0) { throw new Error('Deposit must be positive'); }
        this.#balance += amount;
        this.#transactions.push({ type: 'deposit', amount, date: new Date() });
    }

    withdraw(amount) {
        if (amount > this.#balance) { throw new Error('Insufficient funds'); }
        this.#balance -= amount;
        this.#transactions.push({ type: 'withdrawal', amount, date: new Date() });
    }

    get balance() { return this.#balance; } // read-only access

    get statement() {
        return this.#transactions.map(t =>
            \`\${t.type}: $\${t.amount.toFixed(2)}\`
        ).join('\\n');
    }
}

const account = new BankAccount(1000);
account.deposit(250);
account.withdraw(100);
console.log('Balance:', account.balance);
console.log(account.statement);`,
        keywords: ['encapsulation', 'private', '#', 'getter', 'setter', 'access control'],
    },

    // ─── Async ───
    {
        id: 'promise',
        name: 'Promise',
        category: 'Async',
        oneLineExplanation: 'An object representing the eventual completion or failure of an async operation.',
        fullExplanation: 'Promises replace callback-based async code with a chainable API. A Promise is pending, then either fulfilled (resolved) or rejected. .then() handles success, .catch() handles errors, and .finally() runs cleanup regardless of outcome.',
        playgroundCode: `// Simulate fetching user data from an API
function fetchUser(id) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const users = { 1: 'Alex', 2: 'Maria', 3: 'James' };
            if (users[id]) {
                resolve({ id, name: users[id] });
            } else {
                reject(new Error(\`User \${id} not found\`));
            }
        }, 500);
    });
}

// Promise chaining
fetchUser(1)
    .then(user => {
        console.log('Found:', user.name);
        return fetchUser(2); // chain another async call
    })
    .then(user => console.log('Also found:', user.name))
    .catch(err => console.error('Error:', err.message))
    .finally(() => console.log('Done fetching'));

// Promise.all — run in parallel, wait for all
Promise.all([fetchUser(1), fetchUser(2), fetchUser(3)])
    .then(users => console.log('All users:', users.map(u => u.name)));`,
        keywords: ['promise', 'Promise', 'then', 'catch', 'resolve', 'reject'],
    },
    {
        id: 'async-await',
        name: 'async/await',
        category: 'Async',
        oneLineExplanation: 'Write asynchronous code that reads like synchronous code.',
        fullExplanation: 'async/await is syntactic sugar over Promises. An async function always returns a Promise. The await keyword pauses execution until a Promise settles, making async flows linear and readable. Error handling uses familiar try/catch.',
        playgroundCode: `// Simulate async operations
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function processOrder(orderId) {
    console.log(\`Processing order \${orderId}...\`);

    try {
        await delay(200);
        console.log('  Payment verified');

        await delay(200);
        console.log('  Inventory reserved');

        await delay(200);
        console.log('  Shipping label created');

        return { orderId, status: 'shipped' };
    } catch (error) {
        console.error('Order failed:', error.message);
        return { orderId, status: 'failed' };
    }
}

// Sequential
const result = await processOrder('ORD-001');
console.log('Result:', result);

// Parallel — when operations are independent
const [a, b] = await Promise.all([
    processOrder('ORD-002'),
    processOrder('ORD-003'),
]);
console.log('Both done:', a.status, b.status);`,
        keywords: ['async', 'await', 'asynchronous'],
    },
    {
        id: 'event-loop',
        name: 'Event Loop',
        category: 'Async',
        oneLineExplanation: 'The mechanism that lets JavaScript handle async operations on a single thread.',
        fullExplanation: 'JavaScript is single-threaded but non-blocking. The event loop continuously checks: (1) execute all synchronous code, (2) run microtasks (Promise callbacks), (3) run macrotasks (setTimeout, I/O). Understanding this order prevents subtle timing bugs.',
        playgroundCode: `console.log('1. Synchronous — runs first');

setTimeout(() => {
    console.log('4. Macrotask — runs after microtasks');
}, 0);

Promise.resolve().then(() => {
    console.log('3. Microtask — runs after sync, before macrotask');
});

console.log('2. Still synchronous — runs before any async');

// Output order: 1, 2, 3, 4
// Even though setTimeout has 0ms delay, Promises (microtasks)
// always execute before setTimeout (macrotasks)`,
        keywords: ['event loop', 'microtask', 'macrotask', 'call stack', 'task queue'],
    },

    // ─── DOM/Web ───
    {
        id: 'query-selector',
        name: 'querySelector',
        category: 'DOM/Web',
        oneLineExplanation: 'Find DOM elements using CSS selectors.',
        fullExplanation: 'document.querySelector() returns the first element matching a CSS selector. querySelectorAll() returns all matches as a NodeList. These replaced older methods like getElementById and getElementsByClassName with a unified, powerful API.',
        playgroundCode: `// Assume this HTML exists:
// <div class="card" data-priority="high">
//   <h2 class="card-title">Important Task</h2>
//   <p class="card-body">Complete the project review</p>
// </div>

// Single element
const card = document.querySelector('.card[data-priority="high"]');

// All matching elements
const allCards = document.querySelectorAll('.card');
allCards.forEach(card => {
    console.log(card.querySelector('.card-title')?.textContent);
});

// Scoped queries — search within an element
const title = card?.querySelector('.card-title');
console.log('Title:', title?.textContent);

// Common patterns
const isChecked = document.querySelector('#terms')?.checked;
const selectedValue = document.querySelector('select#role')?.value;`,
        keywords: ['querySelector', 'querySelectorAll', 'DOM', 'selector', 'element'],
    },
    {
        id: 'event-delegation',
        name: 'Event Delegation',
        category: 'DOM/Web',
        oneLineExplanation: 'Attach one event listener to a parent instead of many to children.',
        fullExplanation: 'Events bubble up from child to parent. Instead of attaching a listener to every list item, attach one to the list container. This handles dynamic elements automatically, uses less memory, and simplifies setup/teardown.',
        playgroundCode: `// Instead of adding a listener to every button...
// Add ONE listener to the container
const container = document.querySelector('.toolbar');

container?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) { return; } // clicked outside a button

    const action = button.dataset.action;
    switch (action) {
        case 'save':
            console.log('Saving document...');
            break;
        case 'delete':
            console.log('Deleting item...');
            break;
        case 'export':
            console.log('Exporting data...');
            break;
    }
});

// This works even for buttons added later — no re-binding needed`,
        keywords: ['event delegation', 'event bubbling', 'addEventListener', 'event.target'],
    },
    {
        id: 'fetch-api',
        name: 'Fetch API',
        category: 'DOM/Web',
        oneLineExplanation: 'Modern browser API for making HTTP requests, returning Promises.',
        fullExplanation: 'fetch() replaces XMLHttpRequest with a cleaner, Promise-based API. It supports all HTTP methods, headers, request/response streaming, and AbortController for cancellation. Note: fetch does not reject on HTTP error status codes — you must check response.ok.',
        playgroundCode: `async function fetchWithErrorHandling(url) {
    try {
        const response = await fetch(url);

        // fetch does NOT throw on 404/500 — check manually
        if (!response.ok) {
            throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Request was cancelled');
        } else {
            console.error('Fetch failed:', error.message);
        }
        throw error;
    }
}

// POST request with JSON body
async function createUser(userData) {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return response.json();
}

// AbortController for timeout/cancellation
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000); // 5s timeout
// fetch(url, { signal: controller.signal });`,
        keywords: ['fetch', 'HTTP', 'request', 'response', 'API call', 'XMLHttpRequest'],
    },
    {
        id: 'local-storage',
        name: 'localStorage',
        category: 'DOM/Web',
        oneLineExplanation: 'Browser key-value store that persists across sessions (up to ~5MB).',
        fullExplanation: 'localStorage stores string key-value pairs that survive page reloads and browser restarts. Use JSON.stringify/parse for complex values. It is synchronous, same-origin only, and not suitable for sensitive data. sessionStorage is the session-scoped variant.',
        playgroundCode: `// Store and retrieve user preferences
const preferences = {
    theme: 'dark',
    fontSize: 16,
    sidebarOpen: true,
    recentFiles: ['main.ts', 'styles.css'],
};

// Save (must serialize to string)
localStorage.setItem('user.prefs', JSON.stringify(preferences));

// Retrieve (must parse back)
const saved = JSON.parse(localStorage.getItem('user.prefs') || '{}');
console.log('Theme:', saved.theme);
console.log('Recent:', saved.recentFiles);

// Safe wrapper pattern
function getStored(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

console.log(getStored('user.prefs', { theme: 'light' }));`,
        keywords: ['localStorage', 'sessionStorage', 'storage', 'persist', 'save'],
    },

    // ─── CSS ───
    {
        id: 'flexbox',
        name: 'Flexbox',
        category: 'CSS',
        oneLineExplanation: 'One-dimensional layout — distribute space and align items along a row or column.',
        fullExplanation: 'Flexbox handles layout in one direction at a time (row or column). The container (display: flex) controls spacing, alignment, and wrapping. Items can grow, shrink, or have fixed sizes. It replaces most float and positioning hacks.',
        playgroundCode: `/* Container — controls the layout axis and item distribution */
.toolbar {
    display: flex;
    justify-content: space-between; /* spread items along main axis */
    align-items: center;            /* center items on cross axis */
    gap: 8px;                       /* space between items */
    padding: 8px 16px;
}

/* Items — control their own sizing within the flex context */
.toolbar-title {
    flex: 1;        /* grow to fill available space */
    font-weight: 600;
}

.toolbar-button {
    flex: 0 0 auto; /* don't grow, don't shrink, use natural size */
    padding: 4px 12px;
}

/* Common patterns */
.card-grid {
    display: flex;
    flex-wrap: wrap;    /* allow items to wrap to next line */
    gap: 16px;
}

.card {
    flex: 1 1 300px;    /* grow and shrink, minimum 300px before wrapping */
}`,
        keywords: ['flexbox', 'flex', 'display: flex', 'justify-content', 'align-items'],
    },
    {
        id: 'css-grid',
        name: 'CSS Grid',
        category: 'CSS',
        oneLineExplanation: 'Two-dimensional layout — define rows AND columns simultaneously.',
        fullExplanation: 'CSS Grid handles both dimensions at once. Define a grid template with rows and columns, then place items into specific cells or areas. Use fr units for flexible sizing. Grid is ideal for page layouts, dashboards, and any two-dimensional arrangement.',
        playgroundCode: `/* Dashboard layout — header, sidebar, main, footer */
.dashboard {
    display: grid;
    grid-template-columns: 240px 1fr;          /* sidebar + flexible main */
    grid-template-rows: 60px 1fr 40px;         /* header + content + footer */
    grid-template-areas:
        "header  header"
        "sidebar main"
        "footer  footer";
    height: 100vh;
    gap: 1px;
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }

/* Responsive card grid — auto-fit calculates column count */
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    padding: 24px;
}`,
        keywords: ['grid', 'CSS grid', 'display: grid', 'grid-template', 'fr'],
    },
    {
        id: 'css-variables',
        name: 'CSS Custom Properties',
        category: 'CSS',
        oneLineExplanation: 'Variables in CSS (--name) that cascade and can be changed at runtime.',
        fullExplanation: 'CSS custom properties (variables) are inherited and can be scoped to any selector. Unlike preprocessor variables, they are live in the browser and can be changed via JavaScript or media queries. This enables dynamic theming, component-level overrides, and responsive design tokens.',
        playgroundCode: `/* Define design tokens at the root */
:root {
    --color-primary: #E8A948;
    --color-surface: rgba(30, 30, 30, 0.95);
    --radius-md: 12px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --transition-ease: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Use them throughout — single source of truth */
.card {
    background: var(--color-surface);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    transition: transform 200ms var(--transition-ease);
}

/* Override at component level */
.card--highlighted {
    --color-surface: rgba(232, 169, 72, 0.1);
}

/* Dark/light theme switch — change variables, not rules */
@media (prefers-color-scheme: light) {
    :root {
        --color-surface: rgba(255, 255, 255, 0.95);
    }
}`,
        keywords: ['CSS variable', 'custom property', '--', 'var()', 'design token'],
    },
    {
        id: 'media-queries',
        name: 'Media Queries',
        category: 'CSS',
        oneLineExplanation: 'Apply styles conditionally based on screen size, theme, or device capabilities.',
        fullExplanation: 'Media queries let CSS respond to the environment. @media (max-width: 768px) targets mobile screens. prefers-color-scheme detects dark mode. prefers-reduced-motion respects accessibility settings. Container queries (@container) scope responsiveness to a parent element.',
        playgroundCode: `/* Mobile-first approach: base styles are mobile, enhance upward */
.grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
}

/* Tablet and up */
@media (min-width: 768px) {
    .grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Desktop and up */
@media (min-width: 1024px) {
    .grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}

@media (prefers-color-scheme: dark) {
    :root { --bg: #1a1a1a; --fg: #e0e0e0; }
}`,
        keywords: ['media query', '@media', 'responsive', 'breakpoint', 'mobile-first'],
    },

    // ─── Git ───
    {
        id: 'git-branch',
        name: 'Git Branching',
        category: 'Git',
        oneLineExplanation: 'Create parallel lines of development that can be merged back together.',
        fullExplanation: 'Branches let you work on features, fixes, or experiments without affecting the main codebase. Each branch is just a pointer to a commit. Branching is instant in Git. The standard flow: create branch, make commits, open PR, merge, delete branch.',
        playgroundCode: `# Create and switch to a new branch
git checkout -b feature/user-auth

# Make changes and commit
git add src/auth.ts
git commit -m "Add JWT authentication middleware"

# Push branch to remote
git push -u origin feature/user-auth

# After PR review, merge into main
git checkout main
git pull origin main
git merge feature/user-auth

# Clean up
git branch -d feature/user-auth
git push origin --delete feature/user-auth

# List branches
git branch -a        # all branches (local + remote)
git branch --merged  # branches already merged into current`,
        keywords: ['branch', 'git branch', 'checkout', 'merge', 'feature branch'],
    },
    {
        id: 'git-rebase',
        name: 'Git Rebase',
        category: 'Git',
        oneLineExplanation: 'Replay your commits on top of another branch for a linear history.',
        fullExplanation: 'Rebase moves your branch commits to start from the tip of another branch, creating a clean linear history. Unlike merge (which creates a merge commit), rebase rewrites commit hashes. Golden rule: never rebase commits that others have based work on.',
        playgroundCode: `# You're on feature/dashboard, main has moved ahead
git checkout feature/dashboard

# Rebase onto latest main — replays your commits on top
git rebase main

# If conflicts occur during rebase:
# 1. Fix the conflict in the file
# 2. Stage the fix
git add src/dashboard.ts
# 3. Continue the rebase
git rebase --continue

# Or abort if things go wrong
git rebase --abort

# After rebase, force-push (your commits have new hashes)
git push --force-with-lease origin feature/dashboard

# Interactive rebase — clean up commits before merging
git rebase -i HEAD~3
# Lets you: squash, reword, reorder, or drop commits`,
        keywords: ['rebase', 'git rebase', 'interactive rebase', 'squash', 'linear history'],
    },
    {
        id: 'git-stash',
        name: 'Git Stash',
        category: 'Git',
        oneLineExplanation: 'Temporarily shelve uncommitted changes to work on something else.',
        fullExplanation: 'Git stash saves your working directory changes on a stack, giving you a clean working tree. This lets you switch branches without committing half-done work. Pop the stash later to restore your changes.',
        playgroundCode: `# Save current changes to the stash
git stash push -m "WIP: refactoring auth module"

# Now your working directory is clean — switch branches freely
git checkout hotfix/login-bug
# ... fix the bug, commit, switch back ...
git checkout feature/auth

# Restore your stashed changes
git stash pop    # applies and removes from stash

# Or apply without removing (keep in stash as backup)
git stash apply

# List all stashes
git stash list
# stash@{0}: On feature/auth: WIP: refactoring auth module
# stash@{1}: On main: experimental CSS changes

# Apply a specific stash
git stash apply stash@{1}

# Drop a stash you no longer need
git stash drop stash@{1}`,
        keywords: ['stash', 'git stash', 'shelve', 'wip', 'work in progress'],
    },

    // ─── Algorithms ───
    {
        id: 'recursion',
        name: 'Recursion',
        category: 'Algorithms',
        oneLineExplanation: 'A function that calls itself, solving smaller subproblems until reaching a base case.',
        fullExplanation: 'Recursion breaks a problem into smaller identical subproblems. Every recursive function needs: (1) a base case that stops recursion, and (2) a recursive case that reduces toward the base. It naturally models trees, nested structures, and divide-and-conquer algorithms.',
        playgroundCode: `// Factorial — the classic
function factorial(n) {
    if (n <= 1) { return 1; }  // base case
    return n * factorial(n - 1); // recursive case
}
console.log('5! =', factorial(5)); // 120

// Tree traversal — where recursion truly shines
const fileSystem = {
    name: 'project',
    children: [
        { name: 'src', children: [
            { name: 'index.ts', children: [] },
            { name: 'utils', children: [
                { name: 'math.ts', children: [] },
                { name: 'string.ts', children: [] },
            ]},
        ]},
        { name: 'package.json', children: [] },
    ],
};

function listFiles(node, indent = '') {
    console.log(indent + node.name);
    for (const child of node.children) {
        listFiles(child, indent + '  ');
    }
}
listFiles(fileSystem);`,
        keywords: ['recursion', 'recursive', 'base case', 'call stack', 'divide and conquer'],
    },
    {
        id: 'binary-search',
        name: 'Binary Search',
        category: 'Algorithms',
        oneLineExplanation: 'Find an item in a sorted array by halving the search space each step — O(log n).',
        fullExplanation: 'Binary search works on sorted data. Compare the target to the middle element: if smaller, search the left half; if larger, search the right half. Each step eliminates half the remaining elements. Searching 1 million items takes at most 20 comparisons.',
        playgroundCode: `function binarySearch(sorted, target) {
    let low = 0;
    let high = sorted.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (sorted[mid] === target) { return mid; }
        if (sorted[mid] < target) { low = mid + 1; }
        else { high = mid - 1; }
    }
    return -1; // not found
}

const prices = [1.50, 3.00, 4.50, 7.25, 12.00, 15.99, 24.50, 49.99];
const index = binarySearch(prices, 12.00);
console.log('Found at index:', index); // 4

// Compare: linear search checks every element — O(n)
// Binary search halves each time — O(log n)
// For 1,000,000 items: ~1,000,000 vs ~20 comparisons

// Real use: finding the right breakpoint
function findInsertionPoint(sorted, value) {
    let low = 0, high = sorted.length;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (sorted[mid] < value) { low = mid + 1; }
        else { high = mid; }
    }
    return low;
}
console.log('Insert 10 at index:', findInsertionPoint(prices, 10));`,
        keywords: ['binary search', 'bisect', 'log n', 'sorted', 'search'],
    },
    {
        id: 'big-o',
        name: 'Big O Notation',
        category: 'Algorithms',
        oneLineExplanation: 'Describes how an algorithm scales — O(1) is constant, O(n) is linear, O(n^2) is quadratic.',
        fullExplanation: 'Big O describes the worst-case growth rate of time or space as input grows. O(1) means the operation takes the same time regardless of size. O(n) grows linearly. O(n^2) grows quadratically. Choosing the right algorithm can mean the difference between 1 second and 1 hour.',
        playgroundCode: `const data = Array.from({ length: 10000 }, (_, i) => i);

// O(1) — constant: same speed regardless of array size
function getFirst(arr) { return arr[0]; }
console.log('O(1):', getFirst(data));

// O(n) — linear: touch each element once
function sum(arr) {
    let total = 0;
    for (const n of arr) { total += n; }
    return total;
}
console.log('O(n):', sum(data));

// O(n^2) — quadratic: nested loops (avoid for large data!)
function hasDuplicates(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j]) { return true; }
        }
    }
    return false;
}

// O(n) solution using Set — much faster
function hasDuplicatesFast(arr) {
    return new Set(arr).size !== arr.length;
}

console.log('O(n) dup check:', hasDuplicatesFast(data));`,
        keywords: ['big o', 'complexity', 'O(n)', 'performance', 'scalability', 'time complexity'],
    },
    {
        id: 'hash-table',
        name: 'Hash Table',
        category: 'Algorithms',
        oneLineExplanation: 'A data structure that maps keys to values with O(1) average lookup.',
        fullExplanation: 'Hash tables use a hash function to compute an index into an array of buckets. JavaScript objects and Map are hash tables underneath. They provide near-instant lookup, insertion, and deletion, making them the go-to structure for caching, counting, and indexing.',
        playgroundCode: `// Count word frequencies — classic hash table use case
function wordFrequency(text) {
    const freq = {};
    const words = text.toLowerCase().match(/\\w+/g) || [];
    for (const word of words) {
        freq[word] = (freq[word] || 0) + 1;
    }
    return freq;
}

const text = 'the quick brown fox jumps over the lazy dog the fox';
const freq = wordFrequency(text);
console.log('Word frequencies:', freq);

// Two-sum problem — O(n) with hash table vs O(n^2) brute force
function twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement), i];
        }
        seen.set(nums[i], i);
    }
    return null;
}

console.log('Two sum [2,7,11,15] target 9:', twoSum([2, 7, 11, 15], 9));`,
        keywords: ['hash table', 'hash map', 'dictionary', 'lookup', 'O(1)'],
    },

    // ─── Design Patterns ───
    {
        id: 'observer-pattern',
        name: 'Observer Pattern',
        category: 'Design Patterns',
        oneLineExplanation: 'Objects subscribe to events and get notified when something changes.',
        fullExplanation: 'The Observer pattern decouples the source of events from the handlers. The subject maintains a list of observers and notifies them on state changes. This is the foundation of event systems, reactive programming, and MVC architectures.',
        playgroundCode: `class EventEmitter {
    #listeners = new Map();

    on(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, []);
        }
        this.#listeners.get(event).push(callback);
        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    off(event, callback) {
        const cbs = this.#listeners.get(event);
        if (cbs) {
            this.#listeners.set(event, cbs.filter(cb => cb !== callback));
        }
    }

    emit(event, ...args) {
        const cbs = this.#listeners.get(event) || [];
        for (const cb of cbs) { cb(...args); }
    }
}

// Usage: decouple cart from UI
const store = new EventEmitter();
store.on('item:added', item => console.log(\`Cart updated: added \${item}\`));
store.on('item:added', item => console.log(\`Analytics: tracked \${item}\`));

store.emit('item:added', 'Mechanical Keyboard');`,
        keywords: ['observer', 'event emitter', 'subscribe', 'publish', 'listener', 'pub/sub'],
    },
    {
        id: 'singleton-pattern',
        name: 'Singleton Pattern',
        category: 'Design Patterns',
        oneLineExplanation: 'Ensure a class has only one instance, providing a global access point.',
        fullExplanation: 'Singleton restricts instantiation to a single object. Useful for configuration managers, connection pools, and loggers. In modern JavaScript, ES modules are already singletons — exporting an instance from a module achieves the same effect without the pattern overhead.',
        playgroundCode: `class Configuration {
    static #instance = null;

    #settings = {};

    // Private constructor — can't be called with 'new' from outside
    constructor() {
        if (Configuration.#instance) {
            throw new Error('Use Configuration.getInstance()');
        }
    }

    static getInstance() {
        if (!Configuration.#instance) {
            Configuration.#instance = new Configuration();
        }
        return Configuration.#instance;
    }

    set(key, value) { this.#settings[key] = value; }
    get(key) { return this.#settings[key]; }
    getAll() { return { ...this.#settings }; }
}

// Both references point to the same instance
const config1 = Configuration.getInstance();
config1.set('theme', 'dark');

const config2 = Configuration.getInstance();
console.log(config2.get('theme')); // 'dark' — same instance
console.log(config1 === config2);  // true`,
        keywords: ['singleton', 'single instance', 'global state', 'getInstance'],
    },
    {
        id: 'factory-pattern',
        name: 'Factory Pattern',
        category: 'Design Patterns',
        oneLineExplanation: 'Create objects without specifying the exact class — let a function decide.',
        fullExplanation: 'The Factory pattern encapsulates object creation. Instead of using new directly, you call a factory function that decides which class to instantiate based on input. This centralizes creation logic and makes it easy to add new types without changing calling code.',
        playgroundCode: `// Different notification types with different behaviors
class EmailNotification {
    constructor(to, message) { this.to = to; this.message = message; }
    send() { console.log(\`Email to \${this.to}: \${this.message}\`); }
}

class SMSNotification {
    constructor(to, message) { this.to = to; this.message = message; }
    send() { console.log(\`SMS to \${this.to}: \${this.message}\`); }
}

class PushNotification {
    constructor(to, message) { this.to = to; this.message = message; }
    send() { console.log(\`Push to \${this.to}: \${this.message}\`); }
}

// Factory — centralizes creation logic
function createNotification(type, to, message) {
    const types = {
        email: EmailNotification,
        sms: SMSNotification,
        push: PushNotification,
    };
    const NotifClass = types[type];
    if (!NotifClass) { throw new Error(\`Unknown notification type: \${type}\`); }
    return new NotifClass(to, message);
}

// Usage — caller doesn't need to know the classes
const notif = createNotification('email', 'alex@example.com', 'Your order shipped!');
notif.send();`,
        keywords: ['factory', 'factory pattern', 'create', 'instantiate', 'builder'],
    },
    {
        id: 'dependency-injection',
        name: 'Dependency Injection',
        category: 'Design Patterns',
        oneLineExplanation: 'Supply dependencies from outside instead of creating them internally.',
        fullExplanation: 'DI means a class receives its dependencies through its constructor or properties rather than creating them with new. This makes code testable (inject mocks), flexible (swap implementations), and loosely coupled (classes do not know concrete types).',
        playgroundCode: `// Without DI — hard-coded dependency, can't test or swap
class OrderServiceBad {
    process(order) {
        const db = new PostgresDatabase(); // tight coupling!
        db.save(order);
    }
}

// With DI — dependency is injected, can be anything
class OrderService {
    constructor(database, logger) {
        this.database = database;
        this.logger = logger;
    }

    async process(order) {
        this.logger.info(\`Processing order \${order.id}\`);
        await this.database.save('orders', order);
        this.logger.info('Order saved successfully');
    }
}

// Production: real dependencies
// const service = new OrderService(new PostgresDB(), new FileLogger());

// Testing: mock dependencies
const mockDb = { save: (table, data) => console.log(\`Mock save to \${table}\`) };
const mockLog = { info: msg => console.log(\`[TEST] \${msg}\`) };
const service = new OrderService(mockDb, mockLog);
service.process({ id: 'ORD-001', total: 49.99 });`,
        keywords: ['dependency injection', 'DI', 'inject', 'inversion of control', 'IoC'],
    },

    // ─── Testing ───
    {
        id: 'unit-test',
        name: 'Unit Testing',
        category: 'Testing',
        oneLineExplanation: 'Test individual functions or classes in isolation to verify they work correctly.',
        fullExplanation: 'Unit tests verify the smallest testable parts of code. Each test follows Arrange-Act-Assert: set up inputs, call the function, check the output. Good unit tests are fast, isolated, repeatable, and self-documenting. They catch regressions before they reach users.',
        playgroundCode: `// Function to test
function calculateDiscount(price, customerType) {
    if (price < 0) { throw new Error('Price cannot be negative'); }
    const rates = { regular: 0, premium: 0.10, vip: 0.20 };
    const rate = rates[customerType] ?? 0;
    return Math.round(price * (1 - rate) * 100) / 100;
}

// Unit tests (using any test framework pattern)
function assertEqual(actual, expected, label) {
    const pass = actual === expected;
    console.log(pass ? '  PASS' : '  FAIL', label);
    if (!pass) { console.log('    expected:', expected, 'got:', actual); }
}

console.log('calculateDiscount:');
assertEqual(calculateDiscount(100, 'regular'), 100, 'regular gets no discount');
assertEqual(calculateDiscount(100, 'premium'), 90, 'premium gets 10% off');
assertEqual(calculateDiscount(100, 'vip'), 80, 'vip gets 20% off');
assertEqual(calculateDiscount(49.99, 'vip'), 39.99, 'rounds to 2 decimal places');
assertEqual(calculateDiscount(100, 'unknown'), 100, 'unknown type gets no discount');

try {
    calculateDiscount(-10, 'regular');
    console.log('  FAIL negative price should throw');
} catch (e) {
    assertEqual(e.message, 'Price cannot be negative', 'throws on negative price');
}`,
        keywords: ['unit test', 'test', 'assert', 'expect', 'describe', 'it', 'spec'],
    },
    {
        id: 'mock',
        name: 'Mocking',
        category: 'Testing',
        oneLineExplanation: 'Replace real dependencies with controlled fakes to isolate the code under test.',
        fullExplanation: 'Mocks replace real objects (databases, APIs, timers) with test doubles that you control. Stubs return predetermined values. Spies record how they were called. Fakes are simplified implementations. Mocking isolates the unit under test from external systems.',
        playgroundCode: `// The function we want to test calls an external API
class WeatherService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    async getOutfit(city) {
        const weather = await this.apiClient.fetch(\`/weather/\${city}\`);
        if (weather.temp > 80) { return 'shorts and t-shirt'; }
        if (weather.temp > 60) { return 'light jacket'; }
        return 'warm coat';
    }
}

// Mock API client — no real HTTP calls
const mockApiClient = {
    calls: [],
    response: null,
    fetch(url) {
        this.calls.push(url);
        return Promise.resolve(this.response);
    }
};

// Test with controlled data
async function testWeatherService() {
    const service = new WeatherService(mockApiClient);

    mockApiClient.response = { temp: 85 };
    console.log('Hot:', await service.getOutfit('Miami'));

    mockApiClient.response = { temp: 45 };
    console.log('Cold:', await service.getOutfit('Chicago'));

    console.log('API was called:', mockApiClient.calls.length, 'times');
}
testWeatherService();`,
        keywords: ['mock', 'stub', 'spy', 'fake', 'test double', 'jest.fn'],
    },
    {
        id: 'test-driven',
        name: 'Test-Driven Development',
        category: 'Testing',
        oneLineExplanation: 'Write the test first, watch it fail, then write code to make it pass.',
        fullExplanation: 'TDD follows Red-Green-Refactor: (1) write a failing test for the next feature, (2) write the minimum code to pass it, (3) refactor while keeping tests green. This ensures every feature has test coverage and drives simple, focused design.',
        playgroundCode: `// TDD cycle for building a Stack

// Step 1: RED — write test first (it will fail)
function runTests(Stack) {
    const stack = new Stack();

    // Test: new stack is empty
    console.assert(stack.isEmpty() === true, 'new stack should be empty');
    console.assert(stack.size() === 0, 'new stack size should be 0');

    // Test: push and peek
    stack.push('first');
    console.assert(stack.peek() === 'first', 'peek should return top');
    console.assert(stack.size() === 1, 'size should be 1 after push');

    // Test: pop returns and removes top
    console.assert(stack.pop() === 'first', 'pop should return top');
    console.assert(stack.isEmpty() === true, 'should be empty after pop');

    console.log('All tests passed!');
}

// Step 2: GREEN — minimum code to pass
class Stack {
    #items = [];
    push(item) { this.#items.push(item); }
    pop() { return this.#items.pop(); }
    peek() { return this.#items[this.#items.length - 1]; }
    isEmpty() { return this.#items.length === 0; }
    size() { return this.#items.length; }
}

// Step 3: Run tests — REFACTOR if needed
runTests(Stack);`,
        keywords: ['TDD', 'test-driven', 'red green refactor', 'test first'],
    },

    // ================================================================
    // AUDIO & CREATIVE PROGRAMMING — for the music producers and makers
    // ================================================================
    {
        id: 'web-audio-api',
        name: 'Web Audio API',
        category: 'Audio',
        oneLine: 'Browser-native audio synthesis and processing — oscillators, filters, and effects without plugins.',
        fullExplanation: `The Web Audio API lets you create, process, and analyze audio directly in the browser. You build an audio graph: sources (oscillators, samples) connect through processing nodes (gain, filter, delay) to the destination (speakers). It's how browser-based DAWs, synths, and visualizers work.`,
        playgroundCode: `// Create a simple synth with the Web Audio API
const ctx = new AudioContext();

// Oscillator → Gain → Speakers
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.connect(gain);
gain.connect(ctx.destination);

// Configure: A4 note, sine wave, gentle volume
osc.type = 'sine';
osc.frequency.value = 440; // A4
gain.gain.value = 0.3;

// Play for 1 second
osc.start();
osc.stop(ctx.currentTime + 1);

// Try: Change osc.type to 'sawtooth', 'square', or 'triangle'
// Try: Change frequency to 523.25 (C5) or 329.63 (E4)`,
        keywords: ['AudioContext', 'oscillator', 'Web Audio', 'createOscillator', 'audio graph'],
    },
    {
        id: 'midi',
        name: 'MIDI Protocol',
        category: 'Audio',
        oneLine: 'Musical Instrument Digital Interface — note numbers, velocity, and control messages between devices.',
        fullExplanation: `MIDI doesn't carry sound — it carries instructions. Note On (which key, how hard), Note Off, Control Change (knob turns), Program Change (patch select). Note 60 = Middle C, velocity 0-127. The Web MIDI API lets JavaScript talk to hardware controllers, keyboards, and drum pads.`,
        playgroundCode: `// MIDI note number to frequency conversion
function midiToFreq(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
}

// Middle C = MIDI 60
console.log('C4:', midiToFreq(60).toFixed(2), 'Hz');  // 261.63
console.log('A4:', midiToFreq(69).toFixed(2), 'Hz');  // 440.00
console.log('E4:', midiToFreq(64).toFixed(2), 'Hz');  // 329.63

// A chord: C major = C4 + E4 + G4
const chord = [60, 64, 67];
chord.forEach(note => {
    console.log(\`Note \${note}: \${midiToFreq(note).toFixed(2)} Hz\`);
});

// Try: Build an A minor chord (A3=57, C4=60, E4=64)`,
        keywords: ['MIDI', 'note number', 'velocity', 'Web MIDI', 'controller'],
    },
    {
        id: 'sample-rate',
        name: 'Sample Rate & Bit Depth',
        category: 'Audio',
        oneLine: 'How many times per second sound is measured (sample rate) and how precisely (bit depth).',
        fullExplanation: `Digital audio captures sound as a series of measurements. Sample rate = measurements per second (44,100 Hz for CD, 48,000 Hz for video, 96,000 Hz for hi-res). Bit depth = precision per measurement (16-bit = 65,536 levels, 24-bit = 16.7 million levels). Nyquist theorem: you can capture frequencies up to half the sample rate. 44.1kHz captures up to 22.05kHz — the edge of human hearing.`,
        playgroundCode: `// Generate a 440Hz sine wave as raw samples
const sampleRate = 44100;
const frequency = 440;
const duration = 0.01; // 10ms slice
const samples = [];

for (let i = 0; i < sampleRate * duration; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t);
    samples.push(sample);
}

console.log(\`Generated \${samples.length} samples at \${sampleRate}Hz\`);
console.log(\`First 10 values: \${samples.slice(0,10).map(s => s.toFixed(3)).join(', ')}\`);

// Nyquist: max capturable frequency
console.log(\`Nyquist limit: \${sampleRate / 2} Hz\`);`,
        keywords: ['sample rate', '44100', '48000', 'bit depth', 'Nyquist', 'PCM'],
    },
    {
        id: 'bpm-tempo',
        name: 'BPM & Tempo Math',
        category: 'Audio',
        oneLine: 'Beats per minute — the math that converts time to rhythm and rhythm to time.',
        fullExplanation: `BPM (beats per minute) is the clock of music. At 120 BPM: one beat = 500ms, one bar (4 beats) = 2000ms, one 16th note = 125ms. Every sequencer, drum machine, and DAW converts BPM to milliseconds to schedule events. Knowing this math lets you sync visuals to audio, build sequencers, and calculate delay times.`,
        playgroundCode: `// BPM to timing conversion
function bpmToMs(bpm, subdivision = 1) {
    const beatMs = 60000 / bpm;
    return beatMs / subdivision;
}

const bpm = 120;
console.log(\`At \${bpm} BPM:\`);
console.log(\`  Quarter note: \${bpmToMs(bpm)}ms\`);
console.log(\`  Eighth note:  \${bpmToMs(bpm, 2)}ms\`);
console.log(\`  16th note:    \${bpmToMs(bpm, 4)}ms\`);
console.log(\`  Triplet:      \${bpmToMs(bpm, 3).toFixed(1)}ms\`);
console.log(\`  One bar:      \${bpmToMs(bpm) * 4}ms\`);

// Delay time calculator (for echo effects)
function delayTime(bpm, noteValue) {
    const divisions = { '1/4': 1, '1/8': 2, '1/16': 4, '1/8T': 3, 'dotted-1/8': 1.5 };
    return bpmToMs(bpm, divisions[noteValue]);
}
console.log(\`Dotted 1/8 delay: \${delayTime(bpm, 'dotted-1/8').toFixed(1)}ms\`);`,
        keywords: ['BPM', 'tempo', 'beats per minute', 'sequencer', 'timing'],
    },
    {
        id: 'fft',
        name: 'FFT — Fast Fourier Transform',
        category: 'Audio',
        oneLine: 'Converts a signal from time domain to frequency domain — how visualizers and EQs see sound.',
        fullExplanation: `Sound is waves over time (time domain). FFT converts that into frequencies and their amplitudes (frequency domain). This is how audio visualizers show spectrum bars, how EQs isolate frequency bands, and how pitch detection works. The Web Audio API's AnalyserNode does FFT in real-time.`,
        playgroundCode: `// Using Web Audio AnalyserNode for FFT
const ctx = new AudioContext();
const analyser = ctx.createAnalyser();
analyser.fftSize = 2048; // 1024 frequency bins

// Connect a source → analyser → speakers
const osc = ctx.createOscillator();
osc.frequency.value = 440;
osc.connect(analyser);
analyser.connect(ctx.destination);

// Read frequency data
const dataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(dataArray);

console.log(\`FFT bins: \${analyser.frequencyBinCount}\`);
console.log(\`Frequency resolution: \${ctx.sampleRate / analyser.fftSize} Hz per bin\`);
console.log(\`Bin for 440Hz: \${Math.round(440 / (ctx.sampleRate / analyser.fftSize))}\`);`,
        keywords: ['FFT', 'Fourier', 'frequency domain', 'spectrum', 'analyser', 'AnalyserNode'],
    },
    {
        id: 'sidechain',
        name: 'Sidechain Compression',
        category: 'Audio',
        oneLine: 'One signal controls the volume of another — the pump effect in electronic music.',
        fullExplanation: `Sidechain compression ducks one signal when another hits. Classic use: the kick drum triggers the compressor on the bass, creating the "pumping" effect in house/EDM. In code: detect the kick's amplitude, use it to scale the bass gain inversely. The envelope (attack/release times) shapes how the duck feels.`,
        playgroundCode: `// Sidechain compression concept in code
function applySidechain(bassGain, kickAmplitude, threshold, ratio) {
    if (kickAmplitude > threshold) {
        const reduction = (kickAmplitude - threshold) * (1 - 1/ratio);
        return Math.max(0, bassGain - reduction);
    }
    return bassGain;
}

// Simulate: kick hits at different strengths
const threshold = 0.5;
const ratio = 4; // 4:1 compression
const bassLevel = 0.8;

[0.3, 0.5, 0.7, 0.9, 1.0].forEach(kick => {
    const ducked = applySidechain(bassLevel, kick, threshold, ratio);
    console.log(\`Kick: \${kick.toFixed(1)} → Bass: \${ducked.toFixed(3)} (reduction: \${(bassLevel - ducked).toFixed(3)})\`);
});`,
        keywords: ['sidechain', 'compressor', 'duck', 'pumping', 'envelope'],
    },
];

/**
 * Index concepts by keyword for fast detection.
 * Maps lowercase keyword fragments to concept IDs.
 */
export function buildKeywordIndex(): Map<string, string[]> {
    const index = new Map<string, string[]>();
    for (const concept of CONCEPT_LIBRARY) {
        for (const kw of concept.keywords) {
            const lower = kw.toLowerCase();
            const existing = index.get(lower) ?? [];
            existing.push(concept.id);
            index.set(lower, existing);
        }
    }
    return index;
}
