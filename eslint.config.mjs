import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '.cache/**',
      '.pnpm-store/**',
      '**/.venv/**',
      '**/.pytest_cache/**',
      '**/.ruff_cache/**',
      '**/__pycache__/**',
      '**/dist/**',
      '**/.next/**',
      '**/.expo/**',
      '**/.wrangler/**',
      '**/.vinext/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
];
