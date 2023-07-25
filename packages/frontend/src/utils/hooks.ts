import { type Theme, useMediaQuery, type Breakpoint } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

export const useBreakpointDown = (breakpoint: Breakpoint): boolean =>
  useMediaQuery<Theme>((theme) => theme.breakpoints.down(breakpoint));

export const useToggleButtonOrientation = (breakpoint: Breakpoint) =>
  useBreakpointDown(breakpoint) ? 'vertical' : 'horizontal';

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

export const useNotificationPermission = (): {
  permission: NotificationPermission | 'not_supported';
  request: () => Promise<NotificationPermission | 'not_supported'>;
} => {
  const serviceWorkerRegistration = useServiceWorkerRegistration();

  const [permission, setPermission] = useState(
    globalThis.Notification.permission,
  );

  useEffect(() => {
    const handler = () => {
      setPermission(globalThis.Notification.permission);
    };

    if ('permissions' in globalThis.navigator) {
      void (async () => {
        const status = await globalThis.navigator.permissions.query({
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

    const newPermission = await globalThis.Notification.requestPermission();

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
