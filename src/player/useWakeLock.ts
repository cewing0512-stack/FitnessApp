import { useEffect, useState } from 'react';

/**
 * Keeps the screen on while `active`. Browsers drop the lock when the page is
 * hidden, so it's re-requested whenever the page becomes visible again.
 */
export function useWakeLock(active: boolean): { supported: boolean; locked: boolean } {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!supported || !active) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      if (document.visibilityState !== 'visible' || cancelled) return;
      try {
        sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void sentinel.release();
          return;
        }
        setLocked(true);
        sentinel.addEventListener('release', () => setLocked(false));
      } catch {
        setLocked(false); // e.g. low battery mode
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release();
      setLocked(false);
    };
  }, [supported, active]);

  return { supported, locked };
}
