import type { Preview } from "@storybook/tanstack-react";
import "../src/tailwind.css";

import { TooltipRoot } from "#/components/tooltip-root";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <>
        <Story />
        <TooltipRoot />
      </>
    ),
  ],
};

export default preview;
