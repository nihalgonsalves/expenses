/** @type {import('prettier').Config} */
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
