import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

export const setupMockServer = () => {
  const mockServer = setupServer();

  beforeAll(() => {
    mockServer.listen({ onUnhandledFrame: "error" });
  });

  afterEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.close();
  });

  return mockServer;
};
