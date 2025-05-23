import { useState, useEffect } from "react";

import { useServiceWorkerRegistration } from "./useServiceWorkerRegistration";

// undefined on iOS when not installed, for example
const notificationGlobal =
  "Notification" in globalThis ? globalThis.Notification : undefined;

const navigatorPermissions =
  "permissions" in globalThis.navigator
    ? globalThis.navigator.permissions
    : undefined;

const PUSH_SUPPORTED =
  "serviceWorker" in globalThis.navigator && "PushManager" in globalThis.window;

export const useNotificationPermission = (): {
  permission: NotificationPermission | "not_supported";
  request: () => Promise<NotificationPermission | "not_supported">;
} => {
  const serviceWorkerRegistration = useServiceWorkerRegistration();

  const [permission, setPermission] = useState<
    NotificationPermission | "not_supported"
  >(notificationGlobal?.permission ?? "not_supported");

  useEffect(() => {
    const handler = () => {
      setPermission(notificationGlobal?.permission ?? "not_supported");
    };

    if (navigatorPermissions) {
      void (async () => {
        const status = await navigatorPermissions.query({
          name: "notifications",
        });

        status.addEventListener("change", handler);

        return () => {
          status.removeEventListener("change", handler);
        };
      })();
    }
  }, []);

  const request = async () => {
    if (permission === "granted") return permission;

    if (!notificationGlobal) return "not_supported";

    const newPermission = await notificationGlobal.requestPermission();

    // should not be required but not all browsers correctly implement the
    // permission event listener, notably Safari
    setPermission(newPermission);

    return newPermission;
  };

  if (!PUSH_SUPPORTED || !serviceWorkerRegistration) {
    return {
      permission: "not_supported",
      request: async () => "not_supported",
    };
  }

  return { permission, request };
};
