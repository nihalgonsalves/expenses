import { useEffect, useState } from 'react';

const getOnLineStatus = () =>
  typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true;

export const useNavigatorOnLine = (): boolean => {
  const [status, setStatus] = useState(getOnLineStatus());

  useEffect(() => {
    const setOnline = () => {
      setStatus(true);
    };

    const setOffline = () => {
      setStatus(false);
    };

    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);

    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);

  return status;
};
