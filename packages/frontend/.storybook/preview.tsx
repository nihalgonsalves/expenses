// @ts-check

import type { Preview } from "@storybook/react";
import "../src/tailwind.css";
import { MemoryRouter } from "react-router-dom";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (story) => <MemoryRouter initialEntries={["/"]}>{story()}</MemoryRouter>,
  ],
};

// eslint-disable-next-line import/no-default-export
export default preview;
