import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
  ],

  core: {
    disableTelemetry: true,
  },

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
