import { useEffect, useMemo, useState } from 'react';
import { type BehaviorSubject } from 'rxjs';

export const useRXDBQuery = <T>(
  query: () => BehaviorSubject<T>,
  deps: unknown[],
) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedSubject = useMemo(query, deps);

  const [value, setValue] = useState<T>();

  useEffect(() => {
    const subscription = memoizedSubject.subscribe((newValue) => {
      setValue(newValue);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [memoizedSubject]);

  return value;
};
