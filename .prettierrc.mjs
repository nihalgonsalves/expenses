import baseConfig from '@nihalgonsalves/esconfig/.prettierrc.js';

/** @type {import('prettier').Config} */
export default {
  ...baseConfig,
  plugins: ['prettier-plugin-prisma', 'prettier-plugin-sql'],
  overrides: [
    {
      files: '*.sql',
      options: {
        language: 'postgresql',
      },
    },
  ],
};
