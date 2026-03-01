/**
 * @file Jest configuration for Murajiaty tests
 * Configures Jest to run tests with jsdom environment for browser-like testing
 */
module.exports = {
  'testEnvironment': 'jsdom',
  'roots': [ '<rootDir>/../tests' ],
  'testMatch': [ '**/*.test.js' ],
  'collectCoverageFrom': [
    '<rootDir>/../*.js',
    '!<rootDir>/../node_modules/**',
    '!<rootDir>/../tests/**'
  ],
  'coverageDirectory': '../coverage',
  'verbose': true
};