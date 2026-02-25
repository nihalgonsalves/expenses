/** @type {import('prettier').Config} */
// oxlint-disable-next-line import/no-default-export
export default {
  plugins: [
    "prettier-plugin-prisma",
    "prettier-plugin-sql",
    "prettier-plugin-tailwindcss",
  ],
  overrides: [
    {
      files: "*.sql",
      options: {
        language: "postgresql",
      },
    },
  ],
};
