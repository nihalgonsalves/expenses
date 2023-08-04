import { useState, useEffect } from 'react';

// @ts-expect-error iOS specific
const IS_IOS_STANDALONE = window.navigator.standalone === true;
const DISPLAY_MODE_STANDALONE = window.matchMedia('(display-mode: standalone)');

export const useIsStandalone = () => {
  const [isStandalone, setIsStandalone] = useState(
    DISPLAY_MODE_STANDALONE.matches,
  );

  useEffect(() => {
    if (IS_IOS_STANDALONE) {
      return () => {}; // No need to listen for events on iOS
    }

    const handler = (e: MediaQueryListEventMap['change']) => {
      setIsStandalone(e.matches);
    };

    DISPLAY_MODE_STANDALONE.addEventListener('change', handler);
    return () => {
      DISPLAY_MODE_STANDALONE.removeEventListener('change', handler);
    };
  }, [isStandalone]);

  return IS_IOS_STANDALONE || isStandalone;
};
