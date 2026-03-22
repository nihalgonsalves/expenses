/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import {
  ExpirationPlugin,
  type ExpirationPluginOptions,
} from "workbox-expiration";
import type { WorkboxPlugin } from "workbox-core";
import {
  ZNotificationPayload,
  type NotificationPayload,
} from "@nihalgonsalves/expenses-shared/types/notification";

import { prefsDb } from "./state/prefs-db";
import { formatCurrency } from "./utils/money";
import { getTransactionDescription } from "./utils/utils";

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();

// workbox stuff adapted from original vite-plugin-pwa implementation
// and https://robelest.com/journal/pwa-tanstack-start

const getExpirationPlugin = (options: ExpirationPluginOptions) =>
  // TODO: exact optional property type issue with WorkboxPlugin
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  new ExpirationPlugin(options) as WorkboxPlugin;

if (!import.meta.env.DEV) {
  // Precache static assets (injected by workbox-build)
  precacheAndRoute(self.__WB_MANIFEST);
  // Navigation requests: NetworkFirst with offline fallback
  // Caches SSR-rendered HTML pages for offline access
  registerRoute(
    new NavigationRoute(
      new NetworkFirst({
        cacheName: "pages-cache",
        networkTimeoutSeconds: 3,
        // denylist: [/\/api\/.*/, /\/admin\/.*/, /\/assets\/.*/],
        plugins: [
          getExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }),
    ),
  );
}

// Example from https://robelest.com/journal/pwa-tanstack-start
// We currently use react-query-async-persist-client
// API requests: NetworkFirst with timeout
// Replace with your API pattern (e.g., Convex)
// registerRoute(
//   ({ url }) => url.hostname.includes(".convex.cloud"),
//   new NetworkFirst({
//     cacheName: "api-cache",
//     networkTimeoutSeconds: 3,
//     plugins: [
//       new ExpirationPlugin({
//         maxEntries: 100,
//         maxAgeSeconds: 24 * 60 * 60,
//       }),
//     ],
//   }),
// );

// Static assets: CacheFirst for performance
registerRoute(
  ({ request }) =>
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font",
  new CacheFirst({
    cacheName: "static-assets",
    plugins: [
      getExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  }),
);

// Images: CacheFirst
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images-cache",
    plugins: [
      getExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  }),
);

const getActionText = (action: "created" | "updated" | "deleted") => {
  switch (action) {
    case "created":
      return "New";
    case "updated":
      return "Updated";
    case "deleted":
      return "Deleted";
  }
};

const getNotificationPresentation = (payload: NotificationPayload) => {
  if (payload.type === "TEST") {
    return {
      tag: "test",
      title: "Test Notification",
      body: payload.message,
    };
  }

  const formattedMoney = formatCurrency(payload.transaction.money, {
    signDisplay: "never",
  });

  const description = getTransactionDescription(payload.transaction);
  const title = `💶 ${payload.groupSheet.name} – ${description} (${formattedMoney})`;

  if (payload.type === "TRANSFER") {
    return {
      tag: payload.transaction.id,
      title,
      body: `You ${payload.transaction.type} ${formattedMoney} for ${description}`,
    };
  }

  const formattedShare = formatCurrency(payload.transaction.yourShare, {
    signDisplay: "never",
  });

  if (payload.type === "EXPENSE") {
    return {
      tag: payload.transaction.id,
      title,
      body: `${getActionText(payload.action)} expense: ${description} – your share is ${formattedShare}`,
    };
  }

  // (payload.type === 'INCOME')
  return {
    tag: payload.transaction.id,
    title,
    body: `${getActionText(payload.action)} income: ${description} – your share is ${formattedShare}`,
  };
};

const handlePush = async (event: PushEvent) => {
  const result = ZNotificationPayload.safeParse(event.data?.json());

  const { tag, title, body } = result.success
    ? getNotificationPresentation(result.data)
    : {
        tag: "unknown",
        title: "Unknown Notification",
        body: "Open the app to see more",
      };

  await self.registration.showNotification(title, {
    body,
    tag,
  });
};

self.addEventListener("push", (event) => {
  event.waitUntil(handlePush(event));
});

// The SKIP_WAITING message from registerSW.tsx will never be received here if the loaded
// app was before the behaviour changed from update to skip waiting. Hence retain the previous
// behaviour for a single load, then save a flag that tells us not to do that again

self.addEventListener("install", (event) => {
  const KEY = "swPromptForUpdate";

  event.waitUntil(
    (async () => {
      const preference = await prefsDb.getItem<boolean>(KEY);

      if (preference == null) {
        await self.skipWaiting();
        await prefsDb.setItem<boolean>(KEY, true);
      }
    })(),
  );
});

/**
 * see packages/frontend/src/registerSW.tsx
 */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});
