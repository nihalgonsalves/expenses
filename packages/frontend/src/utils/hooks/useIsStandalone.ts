import { useState, useEffect } from 'react';

const DISPLAY_MODE_STANDALONE = window.matchMedia('(display-mode: standalone)');

export const useIsStandalone = () => {
  const [isStandalone, setIsStandalone] = useState(
    DISPLAY_MODE_STANDALONE.matches,
  );

  useEffect(() => {
    const handler = (e: MediaQueryListEventMap['change']) => {
      setIsStandalone(e.matches);
    };

    DISPLAY_MODE_STANDALONE.addEventListener('change', handler);
    return () => {
      DISPLAY_MODE_STANDALONE.removeEventListener('change', handler);
    };
  }, [isStandalone]);

  return isStandalone;
};
