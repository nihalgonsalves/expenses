import "temporal-polyfill/global";

import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { FastResponse } from "srvx";

globalThis.Response = FastResponse;

// oxlint-disable-next-line import/no-default-export
export default createServerEntry({
  async fetch(request) {
    return handler.fetch(request);
  },
});
