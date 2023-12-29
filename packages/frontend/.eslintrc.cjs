const path = require('path');

module.exports = {
  extends: [
    '../../node_modules/@nihalgonsalves/esconfig/.eslintrc.react',
    'plugin:storybook/recommended',
    'plugin:tailwindcss/recommended',
  ],
  plugins: ['storybook', 'tailwindcss'],
  parserOptions: { tsconfigRootDir: __dirname },
  settings: {
    tailwindcss: {
      callees: ['cn', 'cva'],
      tags: ['twx'],
      config: path.join(__dirname, './tailwind.config.js'),
      whitelist: [
        '(bg|text|border)-(primary|secondary|muted|destructive|popover)(-(foreground|content))?',
      ],
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        project: ['./**/tsconfig*.json'],
      },
    },
  },
  rules: {
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    'react/prop-types': 'off',
  },
  overrides: [
    {
      files: ['*.stories.@(ts|tsx|js|jsx|mjs|cjs)'],
      rules: {
        'import/no-default-export': 'off',
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true },
        ],
      },
    },
  ],
};
