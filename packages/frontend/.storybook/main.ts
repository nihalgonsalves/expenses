import type { StorybookConfig } from "@storybook/tanstack-react";

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
    name: "@storybook/tanstack-react",
    options: {},
  },
};

export default config;
