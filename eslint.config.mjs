import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import jsdocPlugin from 'eslint-plugin-jsdoc';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const compat = new FlatCompat( {
  'baseDirectory': __dirname,
  'recommendedConfig': js.configs.recommended,
  'allConfig': js.configs.all
} );

export default [ ...compat.extends( 'eslint:recommended' ), {
  'files': [ '**/*.js' ],
  'ignores': [ 'tests/**/*.js' ],
  'languageOptions': {
    'globals': {
      ...globals.browser,
      ...globals.node,
      ...globals.jest,
      ...globals.serviceworker,
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
    'func-style': [ 'error', 'expression', { 'allowArrowFunctions': true } ],
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-tag-names': 'error',
    'jsdoc/check-types': 'error',
    'jsdoc/require-param': 'error',
    'jsdoc/require-returns': 'error',
    'jsdoc/require-param-description': 'error',
    'jsdoc/require-jsdoc': [
      'error',
      {
        'require': {
          'FunctionDeclaration': true,
          'MethodDefinition': true,
          'ClassDeclaration': true,
          'ArrowFunctionExpression': true,
          'FunctionExpression': true
        }
      }
    ]
  },

  'plugins': {
    'jsdoc': jsdocPlugin,
  }
}, {
  'files': [ 'tests/**/*.js' ],
  'languageOptions': {
    'globals': {
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
    'func-style': [ 'error', 'expression', { 'allowArrowFunctions': true } ],
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-tag-names': 'error',
    'jsdoc/check-types': 'error',
    'jsdoc/require-param': 'error',
    'jsdoc/require-returns': 'error',
    'jsdoc/require-param-description': 'error',
    'jsdoc/require-jsdoc': [
      'error',
      {
        'require': {
          'FunctionDeclaration': true,
          'MethodDefinition': false,
          'ClassDeclaration': true,
          'ArrowFunctionExpression': false,
          'FunctionExpression': false
        }
      }
    ]
  },

  'plugins': {
    'jsdoc': jsdocPlugin,
  }
} ];
