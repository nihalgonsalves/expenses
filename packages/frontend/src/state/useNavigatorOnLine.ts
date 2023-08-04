import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

const getOnLineStatus = () =>
  typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true;

const navigatorOnLine = atom(getOnLineStatus());

export const useNavigatorOnLine = () => {
  const [onLine] = useAtom(navigatorOnLine);
  return onLine;
};

export const useHydrateNavigatorOnLine = () => {
  const [, setOnLine] = useAtom(navigatorOnLine);

  useEffect(() => {
    const handleOnLine = () => {
      setOnLine(true);
    };

    const handleOffLine = () => {
      setOnLine(false);
    };

    window.addEventListener('online', handleOnLine);
    window.addEventListener('offline', handleOffLine);

    return () => {
      window.removeEventListener('online', handleOnLine);
      window.removeEventListener('offline', handleOffLine);
    };
  }, [setOnLine]);
};
