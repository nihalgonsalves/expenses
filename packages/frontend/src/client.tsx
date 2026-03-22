// TODO: conditional import? causes an error currently.
import "temporal-polyfill/global";

import emojiMartData from "@emoji-mart/data";
import { StartClient } from "@tanstack/react-start/client";
import { init as initEmojiMart } from "emoji-mart";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

import { config } from "./config";
import { registerSW } from "./register-sw";
import { haptics } from "bzzz";

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  globalThis.window.promptEvent = event;
});

await registerSW();

// TODO: Use a react-query client instead of baked-in data
await initEmojiMart({ data: emojiMartData });

// only haptics, no audio
haptics.setOutput("haptics");

import.meta.hot?.accept(() => {
  void registerSW();
});

if (import.meta.env.DEV && !config.VITE_INTEGRATION_TEST) {
  const { scan } = await import("react-scan");

  scan();
}

hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>,
);
