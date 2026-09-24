import { getExercise } from './exercises';
import type { Workout } from './types';
import { DEFAULT_DUMBBELL_LB, formatLb, resolveWeight } from './weights';
import { WORKOUTS } from './workouts';
import { DEFAULT_TIMING, workoutDurationSec } from '../engine/timeline';
import type { TimingSettings, WeightRange } from './types';

export { WORKOUTS };

export const WORKOUT_BY_ID: Record<string, Workout> = Object.fromEntries(WORKOUTS.map((w) => [w.id, w]));

export function getWorkout(id: string): Workout | undefined {
  return WORKOUT_BY_ID[id];
}

export interface WorkoutSummary {
  durationSec: number;
  /** Number of different exercises. */
  exerciseCount: number;
  /** Number of timed work blocks (items × rounds). */
  workBlocks: number;
  /** Weight label for the card, e.g. "10 lb", "15–30 lb", "10 lb + heavy". */
  weightLabel: string;
  hasHeavyItems: boolean;
}

export function summarizeWorkout(
  workout: Workout,
  timing: TimingSettings = DEFAULT_TIMING,
  defaultLb: number = DEFAULT_DUMBBELL_LB,
): WorkoutSummary {
  const exerciseCount = new Set(workout.items.map((i) => i.exerciseId)).size;
  const weights = workout.items.map((item) => resolveWeight(getExercise(item.exerciseId), item, workout, defaultLb));
  const hasHeavyItems = weights.some((w) => w.heavy);

  let lo = Infinity;
  let hi = -Infinity;
  for (const w of weights) {
    if (w.lb === null) continue;
    const [a, b] = typeof w.lb === 'number' ? [w.lb, w.lb] : w.lb;
    lo = Math.min(lo, a);
    hi = Math.max(hi, b);
  }

  let weightLabel: string;
  if (lo === Infinity) weightLabel = 'Bodyweight';
  else if (workout.intensity === 'heavy') weightLabel = formatLb([lo, hi] as WeightRange);
  else weightLabel = hasHeavyItems ? `${defaultLb} lb + heavy` : `${defaultLb} lb`;

  return {
    durationSec: workoutDurationSec(workout, timing),
    exerciseCount,
    workBlocks: workout.items.length * workout.rounds,
    weightLabel,
    hasHeavyItems,
  };
}
