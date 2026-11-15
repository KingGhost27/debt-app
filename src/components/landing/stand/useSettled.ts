import { useEffect, useState } from 'react';

/** The value once it has stopped changing for `ms`, so typing "5000" re-letters a sign once. */
export function useSettled<T>(value: T, ms = 340): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return settled;
}
