import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Features talk to each other only through their index.ts (docs/conventions/folder-structure.md).
const featureBoundaryPattern = {
  group: ['@/features/*/*'],
  message: 'Import another feature through its index.ts: @/features/<name>',
};

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'design-tokens',
    'design-tokens-build',
    'playwright-report',
    'test-results',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-restricted-imports': ['error', { patterns: [featureBoundaryPattern] }],
    },
  },
  {
    // E2E specs must use the shared fixtures, or the console and axe checks are skipped
    // (docs/conventions/testing.md).
    files: ['tests/e2e/**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['test', 'expect'],
              message: "Import test and expect from './fixtures' instead.",
            },
          ],
          patterns: [featureBoundaryPattern],
        },
      ],
    },
  },
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
  },
]);
