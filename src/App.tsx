import { CATEGORIES, CATEGORY_LABELS } from './data/types';
import { WORKOUTS, summarizeWorkout } from './data/library';
import { EXERCISES } from './data/exercises';
import { formatMinutes } from './engine/timeline';

/** Phase 1 preview: a plain read-out of the seeded library. Replaced by the real screens in Phase 2. */
export default function App() {
  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <h1 className="text-3xl font-semibold tracking-tight">Dumbbell Library</h1>
      <p className="mt-1 text-sm text-white/50">
        {WORKOUTS.length} workouts · {EXERCISES.length} exercises (data preview)
      </p>
      {CATEGORIES.map((c) => (
        <section key={c} className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-widest text-white/40">{CATEGORY_LABELS[c]}</h2>
          <ul className="mt-3 space-y-2">
            {WORKOUTS.filter((w) => w.category === c).map((w) => {
              const s = summarizeWorkout(w);
              return (
                <li key={w.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-lg font-medium">{w.name}</span>
                    <span className="shrink-0 text-sm tabular-nums text-white/60">{formatMinutes(s.durationSec)}</span>
                  </div>
                  <div className="mt-1 text-sm text-white/50">
                    {w.format === 'circuit' ? `${w.items.length} × ${w.rounds} rounds` : `${s.workBlocks} straight`} ·{' '}
                    {s.exerciseCount} exercises ·{' '}
                    <span className={w.intensity === 'heavy' ? 'text-heavy' : ''}>{s.weightLabel}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
