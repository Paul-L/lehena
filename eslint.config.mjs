// Lehena — root ESLint flat config.
//
// Strict TypeScript baseline + import ordering + a11y. Storefront extends
// with Next.js + React/React-Hooks rules. Prettier disables conflicting
// formatting rules (formatting is delegated to Prettier).
//
// Run from the repo root:   pnpm lint
// Or per-app:                pnpm --filter @lehena/storefront lint

import js from "@eslint/js"
import nextPlugin from "@next/eslint-plugin-next"
import prettier from "eslint-config-prettier"
import importX from "eslint-plugin-import-x"
import a11y from "eslint-plugin-jsx-a11y"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.medusa/**",
      "**/.turbo/**",
      "**/build/**",
      "**/coverage/**",
      "**/public/**",
      "apps/backend/integration-tests/**",
    ],
  },

  // Baseline JS + TypeScript strict (without type-info to keep CI fast).
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,

  // Shared rules across both apps.
  {
    plugins: {
      "import-x": importX,
      "jsx-a11y": a11y,
    },
    rules: {
      // Imports
      "import-x/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import-x/no-duplicates": "error",
      "import-x/no-cycle": ["warn", { maxDepth: 10 }],
      "import-x/first": "error",
      "import-x/newline-after-import": "warn",

      // a11y — recommended set. Downgraded to warn during Phase 0 baseline;
      // the storefront has substantial existing a11y debt that's addressed
      // template-by-template in Phase 2/3/5. Once those rewrites land, bump
      // back to "error" via per-file overrides.
      ...a11y.flatConfigs.recommended.rules,
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/anchor-is-valid": "warn",

      // TS strictness adjustments.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Downgraded for the Phase 0 baseline; tighten progressively per phase.
      // The existing Medusa starter + Lehena WIP code triggers these heavily;
      // converting to "error" should happen alongside the relevant rewrite
      // (cart/checkout → Phase 5, PDP/listings → Phase 3).
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-unused-expressions": [
        "warn",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "@typescript-eslint/no-dynamic-delete": "warn",
      "@typescript-eslint/no-extraneous-class": "off",
      // Downgrade ban-ts-comment: `@ts-ignore` is legit in some 3rd-party
      // type-mismatch escapes. We'll migrate to `@ts-expect-error` per file
      // as part of relevant phase rewrites.
      "@typescript-eslint/ban-ts-comment": "warn",
      // Requires type information; off until we wire parserOptions.project.
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      // Same family — pre-existing empty blocks in starter code.
      "no-empty": "warn",
    },
  },

  // Storefront — Next.js + React.
  {
    files: ["apps/storefront/**/*.{ts,tsx,js,jsx,mjs}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      // React 19 + TS → these are noise.
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      // Allow unescaped chars in copy-heavy editorial JSX.
      "react/no-unescaped-entities": "off",
      // Downgrade hooks dep-check during baseline; legacy starter has many
      // intentional suppressions. Tighten in Phase 3+.
      "react-hooks/exhaustive-deps": "warn",
      // Custom data-* attributes are flagged by react/no-unknown-property
      // when typoed (e.g. "sata-testid"). Keep as warn so real typos surface
      // without blocking CI on Phase 0.
      "react/no-unknown-property": "warn",
    },
  },

  // Backend — Node-only context.
  {
    files: ["apps/backend/**/*.{ts,js,mjs}"],
    ignores: ["apps/backend/src/admin/**"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Backend admin extensions — React-y, bundled by Medusa's admin bundler.
  {
    files: ["apps/backend/src/admin/**/*.{ts,tsx,js,jsx,mjs}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Config files are CJS or special.
  {
    files: ["**/*.config.{js,cjs,mjs}", "**/.commitlintrc.{js,cjs,mjs}"],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Tests — let `any` slip through and disable some strict checks.
  {
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**", "**/integration-tests/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // Prettier — disables ESLint formatting rules. MUST be last.
  prettier
)
