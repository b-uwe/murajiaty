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
    // --- Possible Problems ---
    'array-callback-return': 'error',
    'no-constant-condition': 'error',
    'no-duplicate-imports': 'error',
    'no-self-compare': 'error',
    'no-undef': 'error',
    'no-unsafe-optional-chaining': 'error',
    'no-unused-vars': 'error',

    // --- Suggestions ---
    'arrow-body-style': [ 'error', 'always' ],
    'block-scoped-var': 'error',
    'default-case': 'error',
    'default-case-last': 'error',
    'default-param-last': 'error',
    'dot-notation': 'error',
    'eqeqeq': 'error',
    'func-style': [ 'error', 'expression', { 'allowArrowFunctions': true } ],
    'no-array-constructor': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-implicit-coercion': 'error',
    'no-implied-eval': 'error',
    'no-irregular-whitespace': 'error',
    'no-iterator': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-lonely-if': 'error',
    'no-multi-assign': 'error',
    'no-multi-spaces': 'error',
    'no-multi-str': 'error',
    'no-nested-ternary': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-octal-escape': 'error',
    'no-proto': 'error',
    'no-redeclare': 'error',
    'no-regex-spaces': 'error',
    'no-return-assign': 'error',
    'no-undef-init': 'error',
    'no-unneeded-ternary': 'error',
    'no-useless-call': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-concat': 'error',
    'no-useless-constructor': 'error',
    'no-useless-rename': 'error',
    'no-useless-return': 'error',
    'no-var': 'error',
    'no-void': 'error',
    'operator-assignment': 'error',
    'prefer-const': 'error',
    'prefer-promise-reject-errors': 'error',
    'prefer-regex-literals': 'error',
    'radix': 'error',

    // --- Layout & Formatting ---
    'arrow-parens': [ 'error', 'always' ],
    'arrow-spacing': 'error',
    'array-bracket-spacing': [ 'error', 'always' ],
    'block-spacing': 'error',
    'brace-style': [ 'error', '1tbs', { 'allowSingleLine': false } ],
    'comma-dangle': 'error',
    'comma-spacing': 'error',
    'comma-style': 'error',
    'computed-property-spacing': [ 'error', 'always' ],
    'indent': [ 'error', 2 ],
    'key-spacing': 'error',
    'keyword-spacing': [ 'error', { 'before': true, 'after': true } ],
    'linebreak-style': [ 'error', 'unix' ],
    'max-depth': [ 'error', 5 ],
    'max-nested-callbacks': 'error',
    'max-params': [ 'error', 5 ],
    'max-statements-per-line': 'error',
    'new-cap': 'error',
    'new-parens': 'error',
    'no-trailing-spaces': 'error',
    'no-whitespace-before-property': 'error',
    'object-curly-spacing': [ 'error', 'always' ],
    'one-var-declaration-per-line': 'error',
    'quote-props': [ 'error', 'always' ],
    'quotes': [ 'error', 'single' ],
    'rest-spread-spacing': 'error',
    'semi': [ 'error', 'always' ],
    'semi-spacing': 'error',
    'semi-style': 'error',
    'space-before-blocks': [ 'error', 'always' ],
    'space-in-parens': [ 'error', 'always' ],
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'spaced-comment': 'error',
    'switch-colon-spacing': 'error',
    'template-curly-spacing': 'error',

    // --- JSDoc ---
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-tag-names': 'error',
    'jsdoc/check-types': 'error',
    'jsdoc/no-undefined-types': 'error',
    'jsdoc/require-description': 'error',
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
    ],
    'jsdoc/require-param': 'error',
    'jsdoc/require-param-description': 'error',
    'jsdoc/require-returns': 'error',
    'jsdoc/require-returns-description': 'error'
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
    // --- Possible Problems ---
    'array-callback-return': 'error',
    'no-constant-condition': 'error',
    'no-duplicate-imports': 'error',
    'no-self-compare': 'error',
    'no-undef': 'error',
    'no-unsafe-optional-chaining': 'error',
    'no-unused-vars': 'error',

    // --- Suggestions ---
    'arrow-body-style': [ 'error', 'always' ],
    'block-scoped-var': 'error',
    'default-case': 'error',
    'default-case-last': 'error',
    'default-param-last': 'error',
    'dot-notation': 'error',
    'eqeqeq': 'error',
    'func-style': [ 'error', 'expression', { 'allowArrowFunctions': true } ],
    'no-array-constructor': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-implicit-coercion': 'error',
    'no-implied-eval': 'error',
    'no-irregular-whitespace': 'error',
    'no-iterator': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-lonely-if': 'error',
    'no-multi-assign': 'error',
    'no-multi-spaces': 'error',
    'no-multi-str': 'error',
    'no-nested-ternary': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-octal-escape': 'error',
    'no-proto': 'error',
    'no-redeclare': 'error',
    'no-regex-spaces': 'error',
    'no-return-assign': 'error',
    'no-undef-init': 'error',
    'no-unneeded-ternary': 'error',
    'no-useless-call': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-concat': 'error',
    'no-useless-constructor': 'error',
    'no-useless-rename': 'error',
    'no-useless-return': 'error',
    'no-var': 'error',
    'no-void': 'error',
    'operator-assignment': 'error',
    'prefer-const': 'error',
    'prefer-promise-reject-errors': 'error',
    'prefer-regex-literals': 'error',
    'radix': 'error',

    // --- Layout & Formatting ---
    'arrow-parens': [ 'error', 'always' ],
    'arrow-spacing': 'error',
    'array-bracket-spacing': [ 'error', 'always' ],
    'block-spacing': 'error',
    'brace-style': [ 'error', '1tbs', { 'allowSingleLine': false } ],
    'comma-dangle': 'error',
    'comma-spacing': 'error',
    'comma-style': 'error',
    'computed-property-spacing': [ 'error', 'always' ],
    'indent': [ 'error', 2 ],
    'key-spacing': 'error',
    'keyword-spacing': [ 'error', { 'before': true, 'after': true } ],
    'linebreak-style': [ 'error', 'unix' ],
    'max-depth': [ 'error', 5 ],
    'max-nested-callbacks': 'error',
    'max-params': [ 'error', 5 ],
    'max-statements-per-line': 'error',
    'new-cap': 'error',
    'new-parens': 'error',
    'no-trailing-spaces': 'error',
    'no-whitespace-before-property': 'error',
    'object-curly-spacing': [ 'error', 'always' ],
    'one-var-declaration-per-line': 'error',
    'quote-props': [ 'error', 'always' ],
    'quotes': [ 'error', 'single' ],
    'rest-spread-spacing': 'error',
    'semi': [ 'error', 'always' ],
    'semi-spacing': 'error',
    'semi-style': 'error',
    'space-before-blocks': [ 'error', 'always' ],
    'space-in-parens': [ 'error', 'always' ],
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'spaced-comment': 'error',
    'switch-colon-spacing': 'error',
    'template-curly-spacing': 'error',

    // --- JSDoc (relaxed for tests) ---
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-tag-names': 'error',
    'jsdoc/check-types': 'error',
    'jsdoc/no-undefined-types': 'error',
    'jsdoc/require-description': 'error',
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
    ],
    'jsdoc/require-param': 'error',
    'jsdoc/require-param-description': 'error',
    'jsdoc/require-returns': 'error',
    'jsdoc/require-returns-description': 'error'
  },

  'plugins': {
    'jsdoc': jsdocPlugin,
  }
} ];
