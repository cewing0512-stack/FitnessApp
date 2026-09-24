import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { accentVars } from '../components/categoryStyle';
import { ExerciseThumb } from '../components/ExerciseThumb';
import { ChevronDownIcon, ChevronLeftIcon, FlameIcon, HeartIcon, PlayIcon } from '../components/icons';
import { getExercise } from '../data/exercises';
import { getWorkout, summarizeWorkout } from '../data/library';
import { COOLDOWNS, MOVE_SEC, WARMUPS, getMove } from '../data/moves';
import { CATEGORY_LABELS, type Workout, type WorkoutItem } from '../data/types';
import { repGuidance, resolveWeight } from '../data/weights';
import { formatMinutes } from '../engine/timeline';
import { useApp } from '../state/store';

export function WorkoutDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const workout = getWorkout(id);
  const { favorites, toggleFavorite, settings } = useApp();

  if (!workout) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-16 text-center">
        <p className="text-lg font-medium">Workout not found</p>
        <Link to="/" className="mt-4 inline-block text-white/60 underline">
          Back to library
        </Link>
      </div>
    );
  }

  const w = workout;
  const s = summarizeWorkout(w, settings, settings.defaultLb);
  const favorite = favorites.has(w.id);
  const heavy = w.intensity === 'heavy';

  return (
    <div style={accentVars(w.category)} className="relative min-h-dvh pb-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-25"
        style={{ background: 'radial-gradient(80% 100% at 15% 0%, var(--accent), transparent 70%)' }}
      />

      <div className="sticky top-0 z-20 bg-ink/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-2">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="grid size-12 place-items-center rounded-full text-white/80 active:bg-white/10"
            aria-label="Back"
          >
            <ChevronLeftIcon className="size-7" />
          </button>
          <button
            type="button"
            onClick={() => toggleFavorite(w.id)}
            aria-pressed={favorite}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`grid size-12 place-items-center rounded-full active:bg-white/10 ${favorite ? 'text-fav' : 'text-white/60'}`}
          >
            <HeartIcon filled={favorite} className="size-6" />
          </button>
        </div>
      </div>

      <main className="relative mx-auto max-w-xl px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--accent)">{CATEGORY_LABELS[w.category]}</p>
        <h1 className="mt-1 text-[32px] font-bold leading-tight tracking-tight">{w.name}</h1>
        <p className="mt-2 text-[17px] leading-snug text-white/65">{w.description}</p>

        <dl className="mt-6 grid grid-cols-4 overflow-hidden rounded-2xl border border-line bg-surface/80">
          <Stat label="Minutes" value={String(Math.round(s.durationSec / 60))} />
          <Stat label="Exercises" value={String(s.exerciseCount)} />
          <Stat label={w.format === 'circuit' ? 'Rounds' : 'Format'} value={w.format === 'circuit' ? String(w.rounds) : 'Straight'} />
          <Stat label="Weight" value={s.weightLabel.replace(' + heavy', '+')} highlight={heavy} />
        </dl>

        {(heavy || s.hasHeavyItems) && (
          <div className="mt-3 flex gap-3 rounded-2xl border border-heavy/30 bg-heavy/10 p-4 text-[15px] leading-snug text-heavy">
            <FlameIcon className="mt-0.5 size-5 shrink-0" />
            <p>
              <span className="font-semibold">Strength / Heavy.</span>{' '}
              {heavy
                ? 'Use the heavier suggested weight for each exercise and aim for 8–10 slow, controlled reps.'
                : 'Exercises with an orange weight are heavy: go heavier and aim for 8–10 slow, controlled reps.'}{' '}
              Rest whenever you need to.
            </p>
          </div>
        )}

        <p className="mt-4 text-sm text-white/45">
          {settings.workSec}s work · {settings.restSec}s rest{w.format === 'circuit' ? ` · ${w.rounds} rounds back to back` : ''}
        </p>

        <MoveSection title="Warm-up" ids={WARMUPS[w.warmup]} />

        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              {w.format === 'circuit' ? 'Circuit' : 'Straight through'}
            </h2>
            <span className="text-sm font-medium text-white/50">
              {w.format === 'circuit' ? `Repeat × ${w.rounds}` : `${w.items.length} blocks, once each`}
            </span>
          </div>
          <ol className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {w.items.map((item, i) => (
              <ExerciseRow key={i} index={i} item={item} workout={w} defaultLb={settings.defaultLb} workSec={settings.workSec} />
            ))}
          </ol>
          {w.format === 'circuit' && (
            <p className="mt-2 px-1 text-sm text-white/40">
              Go through the list {w.rounds} times, with the same rest between every exercise.
            </p>
          )}
        </section>

        <MoveSection title="Cool-down stretch" ids={COOLDOWNS[w.cooldown]} />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-ink via-ink/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
        <Link
          to={`/workout/${w.id}/play`}
          className="mx-auto flex h-16 max-w-xl items-center justify-center gap-3 rounded-2xl bg-work text-xl font-semibold text-ink shadow-[0_8px_30px_-8px] shadow-work/50 transition-transform active:scale-[0.98]"
        >
          <PlayIcon className="size-6" />
          Start · {formatMinutes(s.durationSec)}
        </Link>
      </div>
    </div>
  );
}

interface RowProps {
  index: number;
  item: WorkoutItem;
  workout: Workout;
  defaultLb: number;
  workSec: number;
}

function ExerciseRow({ index, item, workout, defaultLb, workSec }: RowProps) {
  const [open, setOpen] = useState(false);
  const ex = getExercise(item.exerciseId);
  const weight = resolveWeight(ex, item, workout, defaultLb);
  const guidance = repGuidance(ex, item, workout, workSec);
  const sideLabel = item.side ? ` (${item.side === 'left' ? 'L' : 'R'})` : '';

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3 text-left active:bg-white/5"
      >
        <ExerciseThumb id={ex.id} name={ex.name} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[17px] font-medium leading-tight">
            <span className="mr-1.5 tabular-nums text-white/35">{index + 1}</span>
            {ex.name}
            {sideLabel}
          </p>
          <p className="mt-1 truncate text-sm text-white/50">{guidance}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-[15px] font-semibold tabular-nums ${weight.heavy ? 'text-heavy' : 'text-white/85'}`}>
            {weight.label}
          </p>
          {weight.hold !== 'none' && (
            <p className="text-xs text-white/40">{weight.hold === 'pair' ? 'each hand' : 'one dumbbell'}</p>
          )}
        </div>
        <ChevronDownIcon className={`size-5 shrink-0 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-3 px-4 pb-4 pl-[5.25rem] text-[15px] leading-snug">
          <p className="text-white/50">{ex.targetMuscles.join(' · ')}</p>
          <ul className="space-y-1.5">
            {ex.cues.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-work" />
                {c}
              </li>
            ))}
          </ul>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Avoid</p>
            <p className="mt-0.5 text-white/70">{ex.mistakes.join('. ')}.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Easier</p>
            <p className="mt-0.5 text-white/70">{ex.modification}</p>
          </div>
        </div>
      )}
    </li>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center border-r border-line px-1 py-3.5 text-center last:border-r-0">
      <dd
        className={`whitespace-nowrap font-semibold leading-tight tabular-nums ${value.length > 6 ? 'text-[15px]' : 'text-lg'} ${
          highlight ? 'text-heavy' : ''
        }`}
      >
        {value}
      </dd>
      <dt className="mt-0.5 text-xs text-white/45">{label}</dt>
    </div>
  );
}

function MoveSection({ title, ids }: { title: string; ids: string[] }) {
  const minutes = (ids.length * MOVE_SEC) / 60;
  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <span className="text-sm font-medium text-white/50">{minutes} min · bodyweight</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {ids.map((id) => (
          <li key={id} className="rounded-full border border-line bg-surface px-3.5 py-2 text-[15px] text-white/75">
            {getMove(id).name}
          </li>
        ))}
      </ul>
    </section>
  );
}
