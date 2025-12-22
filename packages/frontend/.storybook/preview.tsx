import type { Preview } from "@storybook/react-vite";
import "../src/tailwind.css";
import {
  createMemoryHistory,
  createRoute,
  createRouter,
  createRootRoute,
  RouterProvider,
} from "@tanstack/react-router";

import { TooltipRoot } from "#/components/TooltipRoot";

const rootRoute = createRootRoute();
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/" });
const memoryHistory = createMemoryHistory({ initialEntries: ["/"] });
const routeTree = rootRoute.addChildren([indexRoute]);

const router = createRouter({ routeTree, history: memoryHistory });

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
    (story) => (
      <>
        <RouterProvider router={router} defaultComponent={story} />
        <TooltipRoot />
      </>
    ),
  ],
};

export default preview;
