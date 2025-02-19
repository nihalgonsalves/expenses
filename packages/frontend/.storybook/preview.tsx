import type { Preview } from "@storybook/react";
import "../src/tailwind.css";
import {
  createMemoryHistory,
  createRoute,
  createRouter,
  createRootRoute,
  RouterProvider,
} from "@tanstack/react-router";

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
      // @ts-expect-error does not match the main app's router types
      <RouterProvider router={router} defaultComponent={story} />
    ),
  ],
};

export default preview;
