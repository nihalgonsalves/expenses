import { useResetCache } from '../../api/useCacheReset';
import { useServiceWorkerRegistration } from '../../utils/hooks/useServiceWorkerRegistration';

export const TroubleshootingForm = () => {
  const resetCache = useResetCache();
  const serviceWorker = useServiceWorkerRegistration();

  const handleResetCache = async () => {
    await resetCache();
    await serviceWorker?.unregister();
    window.location.reload();
  };

  return (
    <div className="card card-bordered card-compact">
      <div className="card-body ">
        <h2 className="card-title">Troubleshooting</h2>
        If you are experiencing issues with the app, you can reset the cache
        here. This is safe but you need to be online to reload data.
        <button
          type="button"
          className="btn btn-error btn-outline btn-block mt-4"
          onClick={handleResetCache}
        >
          Reset Cache
        </button>
      </div>
    </div>
  );
};
