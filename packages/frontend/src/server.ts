import "temporal-polyfill/global";

// @ts-expect-error bad types / resolution on ts6? (also remove lint disables when removing)
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { FastResponse } from "srvx";

globalThis.Response = FastResponse;

// oxlint-disable
export default createServerEntry({
  // @ts-expect-error see above
  async fetch(request) {
    return handler.fetch(request);
  },
});
// oxlint-enable
