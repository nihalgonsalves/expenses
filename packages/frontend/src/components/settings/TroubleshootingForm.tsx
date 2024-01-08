import { useState } from 'react';

import { trpc } from '../../api/trpc';
import { useResetCache } from '../../api/useCacheReset';
import { useServiceWorkerRegistration } from '../../utils/hooks/useServiceWorkerRegistration';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const TroubleshootingForm = () => {
  const [state, setState] = useState<'initial' | 'loading' | 'done'>('initial');

  const resetCache = useResetCache();
  const serviceWorker = useServiceWorkerRegistration();

  const { mutateAsync: signOut } = trpc.user.signOut.useMutation();

  const handleReset = async () => {
    setState('loading');

    // wait at least 1 second
    const minTimer = new Promise((resolve) => setTimeout(resolve, 1000));

    localStorage.clear();

    await resetCache();
    await serviceWorker?.unregister();

    await signOut();

    await minTimer;
    setState('done');

    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Troubleshooting</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        If you are experiencing issues with the app, you can reset your session,
        cache data, and local settings here. This is safe but you need to be
        online to sign in and reload data.
        <Button
          $variant="destructive"
          onClick={handleReset}
          isLoading={state === 'loading'}
        >
          {state === 'done' ? 'Done, reloading...' : 'Reset Cache'}
        </Button>
      </CardContent>
    </Card>
  );
};
