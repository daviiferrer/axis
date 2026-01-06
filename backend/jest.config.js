const path = require('path');

module.exports = {
    testEnvironment: 'node',
    verbose: true,
    // roots: ['<rootDir>/tests'],
    moduleNameMapper: {
        '^@api/(.*)$': '<rootDir>/src/api/$1',
        '^@core/(.*)$': '<rootDir>/src/core/$1',
        '^@infra/(.*)$': '<rootDir>/src/infra/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1'
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup_minimal.js'],
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: ['src/**/*.js'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
};
