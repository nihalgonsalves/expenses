import baseConfig from '@nihalgonsalves/esconfig/.prettierrc.js';

/** @type {import('prettier').Config} */
export default {
  ...baseConfig,
  plugins: [
    'prettier-plugin-prisma',
    'prettier-plugin-sql',
    'prettier-plugin-tailwindcss',
  ],
  tailwindConfig: './packages/frontend/tailwind.config.js',
  overrides: [
    {
      files: '*.sql',
      options: {
        language: 'postgresql',
      },
    },
  ],
};
