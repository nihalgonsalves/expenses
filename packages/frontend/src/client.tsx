// TODO: conditional import? causes an error currently.
import "temporal-polyfill/global";

import { StartClient } from "@tanstack/react-start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

import { registerSW } from "./register-sw";
import { haptics } from "bzzz";

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  globalThis.window.promptEvent = event;
});

await registerSW();

// only haptics, no audio
haptics.setOutput("haptics");

import.meta.hot?.accept(() => {
  void registerSW();
});

hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>,
);
