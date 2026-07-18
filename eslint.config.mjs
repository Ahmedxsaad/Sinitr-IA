// Flat ESLint config (ESLint v9). Kept intentionally small: TypeScript's
// compiler is the source of truth for types, so ESLint only enforces a few
// hygiene rules on top of the recommended sets.
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/.next/**', '**/.turbo/**', '**/node_modules/**', '**/coverage/**'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // Unused code must be removed, not silenced. An underscore prefix marks a
      // deliberately unused binding (for example an interface method argument).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Explicit is better than implicit for cross-service boundaries.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
