import { useState } from 'react';

import { useResetCache } from '../../api/useCacheReset';
import { useServiceWorkerRegistration } from '../../state/useServiceWorkerRegistration';
import { Button } from '../form/Button';

export const TroubleshootingForm = () => {
  const [state, setState] = useState<'initial' | 'loading' | 'done'>('initial');

  const resetCache = useResetCache();
  const serviceWorker = useServiceWorkerRegistration();

  const handleResetCache = async () => {
    setState('loading');

    // wait at least 1 second
    const minTimer = new Promise((resolve) => setTimeout(resolve, 1000));

    await resetCache();
    await serviceWorker?.unregister();
    localStorage.clear();

    await minTimer;
    setState('done');

    window.location.reload();
  };

  return (
    <div className="card card-bordered card-compact">
      <div className="card-body ">
        <h2 className="card-title">Troubleshooting</h2>
        If you are experiencing issues with the app, you can reset the cache
        here. This is safe but you need to be online to reload data.
        <Button
          className="btn btn-error btn-outline btn-block mt-4"
          onClick={handleResetCache}
          isLoading={state === 'loading'}
        >
          {state === 'done' ? 'Done, reloading...' : 'Reset Cache'}
        </Button>
      </div>
    </div>
  );
};
