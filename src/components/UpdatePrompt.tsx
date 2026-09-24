import { useMatch } from 'react-router';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Shows "New version available" when a deploy lands. Hidden during workouts,
 * so an update never interrupts one. Reloading is always the user's choice.
 */
export function UpdatePrompt() {
  const onWorkout = useMatch('/workout/:id/*');
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Check for updates hourly while the app stays open.
      if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh || onWorkout) return null;
  return (
    <div className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface-2/95 p-3 pl-4 shadow-2xl backdrop-blur-xl">
      <p className="flex-1 text-[15px]">A new version is available.</p>
      <button type="button" onClick={() => setNeedRefresh(false)} className="h-10 px-3 text-[15px] text-white/60">
        Later
      </button>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="h-10 rounded-xl bg-white px-4 text-[15px] font-semibold text-ink"
      >
        Update
      </button>
    </div>
  );
}
