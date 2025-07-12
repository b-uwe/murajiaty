import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const compat = new FlatCompat( {
  'baseDirectory': __dirname,
  'recommendedConfig': js.configs.recommended,
  'allConfig': js.configs.all
} );

export default [ ...compat.extends( 'eslint:recommended' ), {
  'languageOptions': {
    'globals': {
      ...globals.browser,
      ...globals.node,
      ...globals.jest,
    },

    'ecmaVersion': 'latest',
    'sourceType': 'module',
  },

  'rules': {
    'indent': [ 'error', 2 ],
    'linebreak-style': [ 'error', 'unix' ],
    'quotes': [ 'error', 'single' ],
    'semi': [ 'error', 'always' ],
    'space-before-blocks': [ 'error', 'always' ],
    'object-curly-spacing': [ 'error', 'always' ],
    'array-bracket-spacing': [ 'error', 'always' ],
    'computed-property-spacing': [ 'error', 'always' ],
    'quote-props': [ 'error', 'always' ],
    'arrow-parens': [ 'error', 'always' ],
    'arrow-body-style': [ 'error', 'always' ],
    'brace-style': [ 'error', '1tbs', { 'allowSingleLine': false } ],
    'space-in-parens': [ 'error', 'always' ],
    'keyword-spacing': [ 'error', { 'before': true, 'after': true } ],
    'no-implicit-coercion': 'error',
    'no-multi-assign': 'error',
    'no-undef': 'error',
    'no-unused-vars': 'error',
    'no-constant-condition': 'error',
    'no-redeclare': 'error',
    'no-unsafe-optional-chaining': 'error',
    'no-irregular-whitespace': 'error',
    'no-regex-spaces': 'error',
  },
} ];