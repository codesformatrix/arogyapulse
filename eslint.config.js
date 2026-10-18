import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * ESLint flat config.
 *
 * The ruleset is deliberately strict on the two things that cause real
 * incidents in this codebase: unhandled promise rejections in async route
 * handlers, and accidental leakage of Node globals into browser code.
 */
export default [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'src/public/**',
      '**/*.min.js',
      'package-lock.json',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2023,
        fetch: 'readonly',
      },
    },
    rules: {
      // Correctness
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-return-await': 'error',
      'require-await': 'off',

      // Security posture
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Hygiene
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      'no-shadow': ['error', { builtinGlobals: false }],
      'no-param-reassign': ['warn', { props: false }],
      'object-shorthand': ['error', 'properties'],
      'prefer-template': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
    },
  },
  {
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Browser code: no Node globals, and innerHTML is banned outright because
    // the SPA renders supplier-entered text.
    files: ['src/public/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'element',
          property: 'innerHTML',
          message: 'Use textContent or a DOM builder - never innerHTML with user data.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'AssignmentExpression[left.property.name="innerHTML"]',
          message: 'Use textContent or a DOM builder - never innerHTML with user data.',
        },
        {
          selector: 'CallExpression[callee.object.name="document"][callee.property.name="write"]',
          message: 'document.write is banned.',
        },
      ],
    },
  },
  prettier,
];
