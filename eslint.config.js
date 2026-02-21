import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import sharedConfig from "@nihalgonsalves/esconfig/eslint.config.react-shared.js";

export default tseslint.config(
  {
    ignores: [
      "**/build",
      "**/coverage",
      "**/dist",

      "packages/e2e/playwright-report",
      "packages/e2e/test-results",

      // Not part of any tsc project and tseslint's new project service does not support multiple tsconfigs for a directory, e.g. a root tsconfig.tools.json
      "vitest.config.ts",
      "eslint.config.js",
      ".prettierrc.js",
    ],
  },
  ...sharedConfig,
  {
    rules: {
      "import/extensions": "off",
    },
  },
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "packages/*/test/**/*", "packages/e2e/**/*"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    },
  },
  {
    files: ["packages/e2e/**/*"],
    rules: {
      // false positive with Playwright's `use`
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    files: ["packages/frontend/**/*"],
    rules: {
      "react-compiler/react-compiler": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          allow: ["Redirect"],
        },
      ],
    },
  },
  {
    files: ["packages/frontend/src/routes/**/*"],
    rules: {
      "func-style": ["off"],
      "@typescript-eslint/no-use-before-define": "off",
    },
  },
  {
    files: ["packages/*/bin/**/*"],
    rules: {
      "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    },
  },
  {
    files: ["**/*.config.*"],
    rules: {
      "import/no-default-export": "off",
    },
  },
);
