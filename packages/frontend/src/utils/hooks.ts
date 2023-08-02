import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

const PUSH_SUPPORTED =
  'serviceWorker' in globalThis.navigator && 'PushManager' in globalThis.window;

export const useServiceWorkerRegistration = () => {
  const { data: serviceWorkerRegistration } = useQuery({
    queryKey: ['serviceWorkerRegistration'],
    queryFn: async () =>
      (await globalThis.navigator.serviceWorker.getRegistration()) ?? null,
  });

  return serviceWorkerRegistration ?? undefined;
};

export const usePushSubscription = () => {
  const serviceWorkerRegistration = useServiceWorkerRegistration();

  const { data: pushSubscription } = useQuery({
    queryKey: ['pushSubscription'],
    queryFn: async () =>
      (await serviceWorkerRegistration?.pushManager.getSubscription()) ?? null,
    enabled: serviceWorkerRegistration != null,
  });

  return pushSubscription ?? undefined;
};

// undefined on iOS when not installed, for example
const notificationGlobal =
  'Notification' in globalThis ? globalThis.Notification : undefined;

const navigatorPermissions =
  'permissions' in globalThis.navigator
    ? globalThis.navigator.permissions
    : undefined;

export const useNotificationPermission = (): {
  permission: NotificationPermission | 'not_supported';
  request: () => Promise<NotificationPermission | 'not_supported'>;
} => {
  const serviceWorkerRegistration = useServiceWorkerRegistration();

  const [permission, setPermission] = useState<
    NotificationPermission | 'not_supported'
  >(notificationGlobal?.permission ?? 'not_supported');

  useEffect(() => {
    const handler = () => {
      setPermission(notificationGlobal?.permission ?? 'not_supported');
    };

    if (navigatorPermissions) {
      void (async () => {
        const status = await navigatorPermissions.query({
          name: 'notifications',
        });

        status.addEventListener('change', handler);

        return () => {
          status.removeEventListener('change', handler);
        };
      })();
    }
  }, []);

  const request = useCallback(async () => {
    if (permission === 'granted') return permission;

    if (!notificationGlobal) return 'not_supported';

    const newPermission = await notificationGlobal.requestPermission();

    // should not be required but not all browsers correctly implement the
    // permission event listener, notably Safari
    setPermission(newPermission);

    return newPermission;
  }, [permission]);

  if (!PUSH_SUPPORTED || !serviceWorkerRegistration) {
    return {
      permission: 'not_supported',
      request: () => Promise.resolve('not_supported'),
    };
  }

  return { permission, request };
};

// adapted from https://usehooks-ts.com/react-hook/use-media-query
export const useMediaQuery = (query: string): boolean => {
  const getMatches = (q: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(q).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  const handleChange = useCallback(() => {
    setMatches(getMatches(query));
  }, [query]);

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if query changes
    handleChange();

    // Listen matchMedia
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange);
    } else {
      matchMedia.addEventListener('change', handleChange);
    }

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange);
      } else {
        matchMedia.removeEventListener('change', handleChange);
      }
    };
  }, [query, handleChange]);

  return matches;
};
