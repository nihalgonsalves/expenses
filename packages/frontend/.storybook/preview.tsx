import type { Preview } from "@storybook/react";
import "../src/tailwind.css";
import { MemoryRouter } from "react-router";

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
    (story) => <MemoryRouter initialEntries={["/"]}>{story()}</MemoryRouter>,
  ],
};

export default preview;
