import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { accentVars } from '../components/categoryStyle';
import { HistoryIcon, TrashIcon } from '../components/icons';
import { deleteHistory, listHistory, type HistoryEntry } from '../db/db';
import { CATEGORY_LABELS } from '../data/types';
import { formatDateTime, formatDuration, formatMonth } from '../format';

export function History() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    listHistory()
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  const remove = async (e: HistoryEntry) => {
    if (e.id === undefined || !window.confirm(`Delete ${e.workoutName} from history?`)) return;
    await deleteHistory(e.id);
    setEntries((list) => list?.filter((x) => x.id !== e.id) ?? null);
  };

  const months: [string, HistoryEntry[]][] = [];
  for (const e of entries ?? []) {
    const m = formatMonth(e.completedAt);
    const group = months.at(-1);
    if (group?.[0] === m) group[1].push(e);
    else months.push([m, [e]]);
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="text-[34px] font-bold tracking-tight">History</h1>
      <p className="text-[15px] text-white/50">A simple log of what you've done.</p>

      {entries?.length === 0 && (
        <div className="mt-10 rounded-3xl border border-dashed border-line px-6 py-12 text-center">
          <HistoryIcon className="mx-auto size-8 text-white/40" />
          <p className="mt-3 text-lg font-medium">Nothing logged yet</p>
          <p className="mt-1 text-white/50">Finished workouts show up here.</p>
          <Link to="/" className="mt-5 inline-grid h-11 place-items-center rounded-full bg-surface-2 px-5 font-medium">
            Browse workouts
          </Link>
        </div>
      )}

      {months.map(([month, list]) => (
        <section key={month} className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-widest text-white/40">{month}</h2>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {list.map((e) => (
              <li key={e.id} style={accentVars(e.category)} className="flex items-center">
                <Link to={`/workout/${e.workoutId}`} className="min-w-0 flex-1 p-4 active:bg-white/5">
                  <p className="text-sm text-white/50">{formatDateTime(e.completedAt)}</p>
                  <p className="mt-0.5 truncate text-[17px] font-semibold">{e.workoutName}</p>
                  <p className="mt-0.5 text-sm text-white/55">
                    <span className="text-(--accent)">{CATEGORY_LABELS[e.category]}</span> · {formatDuration(e.durationSec)} ·{' '}
                    {e.exercisesCompleted}/{e.exercisesTotal} exercises
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => void remove(e)}
                  aria-label={`Delete ${e.workoutName} from history`}
                  className="mr-2 grid size-12 shrink-0 place-items-center rounded-full text-white/30 active:bg-white/10 active:text-fav"
                >
                  <TrashIcon className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
