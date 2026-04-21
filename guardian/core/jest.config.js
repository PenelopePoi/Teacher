/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    testMatch: ['**/*.spec.ts'],
    collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 85,
            lines: 85,
            statements: 85
        }
    },
    coverageReporters: ['text', 'lcov', 'json-summary']
};
