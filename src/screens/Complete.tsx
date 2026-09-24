import { Link, Navigate, useLocation, useParams } from 'react-router';
import { accentVars } from '../components/categoryStyle';
import { CheckIcon } from '../components/icons';
import { getWorkout } from '../data/library';
import { formatDuration } from '../format';
import type { CompletionState } from './Player';

export function Complete() {
  const { id = '' } = useParams();
  const result = useLocation().state as CompletionState | null;
  const workout = getWorkout(id);
  if (!workout || !result) return <Navigate to={workout ? `/workout/${id}` : '/'} replace />;

  return (
    <div
      style={accentVars(workout.category)}
      className="relative flex min-h-dvh flex-col overflow-hidden px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%] opacity-40"
        style={{ background: 'radial-gradient(70% 60% at 50% 20%, var(--color-work), transparent 70%)' }}
      />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <div className="animate-pop grid size-28 place-items-center rounded-full bg-work text-ink shadow-[0_0_60px_-10px] shadow-work">
          <CheckIcon className="size-16" strokeWidth={2.5} />
        </div>
        <h1 className="mt-8 text-4xl font-bold tracking-tight">{result.endedEarly ? 'Nice effort' : 'Workout complete'}</h1>
        <p className="mt-2 text-lg text-white/65">{workout.name}</p>

        <dl className="mt-10 grid w-full grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-surface/80 p-5">
            <dd className="text-4xl font-bold tabular-nums">{formatDuration(result.durationSec)}</dd>
            <dt className="mt-1 text-sm text-white/50">Time</dt>
          </div>
          <div className="rounded-2xl border border-line bg-surface/80 p-5">
            <dd className="text-4xl font-bold tabular-nums">
              {result.completed}
              <span className="text-2xl text-white/40">/{result.total}</span>
            </dd>
            <dt className="mt-1 text-sm text-white/50">Exercises</dt>
          </div>
        </dl>
        <p className="mt-4 text-sm text-white/40">Saved to your history.</p>
      </div>

      <div className="relative mx-auto grid w-full max-w-md gap-3">
        <Link to="/" replace className="grid h-16 place-items-center rounded-2xl bg-white text-xl font-semibold text-ink">
          Back to library
        </Link>
        <Link to="/history" replace className="grid h-14 place-items-center rounded-2xl bg-white/10 text-lg font-medium">
          View history
        </Link>
      </div>
    </div>
  );
}
