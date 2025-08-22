/**
 * @file Jest configuration for Murajiaty tests
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