import { Link } from 'react-router';
import type { WorkoutSummary } from '../data/library';
import { CATEGORY_LABELS, type Workout } from '../data/types';
import { formatMinutes } from '../engine/timeline';
import { accentVars } from './categoryStyle';
import { ClockIcon, DumbbellIcon, FlameIcon, HeartIcon, ListIcon } from './icons';

interface Props {
  workout: Workout;
  summary: WorkoutSummary;
  favorite: boolean;
  onToggleFavorite: () => void;
}

export function WorkoutCard({ workout: w, summary: s, favorite, onToggleFavorite }: Props) {
  const heavy = w.intensity === 'heavy';
  return (
    <article
      style={accentVars(w.category)}
      className="relative overflow-hidden rounded-3xl border border-line bg-surface p-5 transition-transform active:scale-[0.99]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-16 size-48 rounded-full opacity-20 blur-3xl"
        style={{ background: 'var(--accent)' }}
      />
      {/* Whole card is the link; the heart sits above it. */}
      <Link to={`/workout/${w.id}`} className="absolute inset-0 z-0" aria-label={`${w.name}, ${formatMinutes(s.durationSec)}`} />

      <div className="pointer-events-none relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--accent)">
            {CATEGORY_LABELS[w.category]}
            <span className="text-white/35"> · {w.format === 'circuit' ? 'Circuit' : 'Straight through'}</span>
          </p>
          <h3 className="mt-1.5 text-[22px] font-semibold leading-tight tracking-tight">{w.name}</h3>
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`pointer-events-auto relative z-10 -mr-2 -mt-2 grid size-12 shrink-0 place-items-center rounded-full transition-colors active:scale-90 ${
            favorite ? 'text-fav' : 'text-white/35 hover:text-white/70'
          }`}
        >
          <HeartIcon filled={favorite} className="size-6" />
        </button>
      </div>

      <div className="pointer-events-none relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-white/70">
        <span className="inline-flex items-center gap-1.5 font-medium text-white">
          <ClockIcon className="size-[18px] text-white/50" />
          {formatMinutes(s.durationSec)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ListIcon className="size-[18px] text-white/50" />
          {s.exerciseCount} exercises{w.format === 'circuit' ? ` × ${w.rounds}` : ''}
        </span>
        {heavy ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-heavy/15 px-2.5 py-1 text-sm font-semibold text-heavy">
            <FlameIcon className="size-4" />
            {s.weightLabel}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <DumbbellIcon className="size-[18px] text-white/50" />
            {s.weightLabel}
          </span>
        )}
      </div>
    </article>
  );
}
