import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "./components/ui/button";
import { queryCache } from "./state/queryCache";
import { useServiceWorkerRegistration } from "./utils/hooks/useServiceWorkerRegistration";
import { durationMilliseconds } from "./utils/temporal";

// https://whatwebcando.today/articles/handling-service-worker-updates/
// https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html

const { url, type } = import.meta.env.PROD
  ? ({ url: "/sw.js", type: "classic" } as const)
  : ({ url: "/dev-sw.js?dev-sw", type: "module" } as const);

export const useSwUpdateCheck = () => {
  const registration = useServiceWorkerRegistration();

  useQuery({
    queryKey: [url],
    queryFn: async () => {
      await registration?.update();
      return null;
    },
    enabled: "serviceWorker" in globalThis.navigator,
    networkMode: "online",
    gcTime: 0,
    staleTime: 0,
    // fetch new sw every 5 mins while running
    // note that this also runs on window focus
    refetchInterval: durationMilliseconds({
      minutes: 5,
    }),
  });
};

const reload = async () => {
  await queryCache.clear();
  window.location.reload();
};

export const registerSW = async () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.register(url, { type });

  const update = () => {
    if (registration.waiting) {
      // TODO
      // oxlint-disable-next-line unicorn/require-post-message-target-origin
      registration.waiting.postMessage("SKIP_WAITING");
    }
  };

  if (registration.waiting) {
    update();
  }

  const promptForUpdate = () => {
    toast(
      <>
        A web app update is available.
        <Button variant="outline" onClick={update}>
          Reload?
        </Button>
      </>,
      {
        id: "update-available",
        duration: Infinity,
        closeButton: true,
        classNames: {
          content: "w-full",
          title: "flex items-center justify-between",
        },
      },
    );
  };

  // detect Service Worker update available and wait for it to become installed
  registration.addEventListener("updatefound", () => {
    if (registration.installing) {
      // wait until the new Service worker is actually installed (ready to take over)
      registration.installing.addEventListener("statechange", () => {
        if (registration.waiting) {
          // if there's an existing controller (previous Service Worker), show the prompt
          if (navigator.serviceWorker.controller) {
            promptForUpdate();
          } else {
            // otherwise it's the first install, nothing to do
            console.log("Service Worker initialized for the first time");
          }
        }
      });
    }
  });

  // detect controller change and refresh the page
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    void reload();
  });
};
