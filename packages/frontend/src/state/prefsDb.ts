import localspace from "localspace";

import { LOCALSPACE_NAMESPACE, PREFERENCES_LOCALSPACE } from "../config";

export const prefsDb = localspace.createInstance({
  name: LOCALSPACE_NAMESPACE,
  storeName: PREFERENCES_LOCALSPACE,
  driver: [localspace.INDEXEDDB],
});
