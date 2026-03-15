/// <reference lib="webworker" />

import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

import {
  ZNotificationPayload,
  type NotificationPayload,
} from "@nihalgonsalves/expenses-shared/types/notification";

import { prefsDb } from "./state/prefs-db";
import { formatCurrency } from "./utils/money";
import { getTransactionDescription } from "./utils/utils";

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();

if (!import.meta.env.DEV) {
  precacheAndRoute(self.__WB_MANIFEST);
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL("/index.html"), {
      denylist: [/\/api\/.*/, /\/admin\/.*/, /\/assets\/.*/],
    }),
  );
}

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
