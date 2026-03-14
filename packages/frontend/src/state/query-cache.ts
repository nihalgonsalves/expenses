import localspace, { ttlPlugin } from "localspace";

import { durationMilliseconds } from "#/utils/temporal";

import { LOCALSPACE_NAMESPACE, REACT_QUERY_CACHE_LOCALSPACE } from "../config";

export const queryCache = localspace.createInstance({
  name: LOCALSPACE_NAMESPACE,
  storeName: REACT_QUERY_CACHE_LOCALSPACE,
  plugins: [ttlPlugin({ defaultTTL: durationMilliseconds({ days: 7 }) })],
});
