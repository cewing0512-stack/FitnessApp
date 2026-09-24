import type { Exercise, Workout, WorkoutItem, WeightRange } from './types';

export const DEFAULT_DUMBBELL_LB = 10;
export const DEFAULT_HEAVY_REPS = '8–10 slow reps';

export interface WeightInfo {
  /** Whether this block is "Strength / Heavy". */
  heavy: boolean;
  /** null for bodyweight moves. */
  lb: number | WeightRange | null;
  /** Human label, e.g. "10 lb", "15–20 lb", "Bodyweight". */
  label: string;
  /** How many dumbbells you hold. */
  hold: 'pair' | 'single' | 'none';
}

export function formatLb(lb: number | WeightRange | null): string {
  if (lb === null) return 'Bodyweight';
  if (typeof lb === 'number') return `${lb} lb`;
  return lb[0] === lb[1] ? `${lb[0]} lb` : `${lb[0]}–${lb[1]} lb`;
}

export function isHeavy(workout: Workout, item: WorkoutItem): boolean {
  return workout.intensity === 'heavy' || item.heavy === true;
}

/** Suggested weight for one block of a workout. */
export function resolveWeight(
  exercise: Exercise,
  item: WorkoutItem,
  workout: Workout,
  defaultLb: number = DEFAULT_DUMBBELL_LB,
): WeightInfo {
  const hold = exercise.equipment === 'two-dumbbells' ? 'pair' : exercise.equipment === 'one-dumbbell' ? 'single' : 'none';
  const heavy = isHeavy(workout, item) && exercise.equipment !== 'bodyweight';

  let lb: number | WeightRange | null;
  if (exercise.equipment === 'bodyweight') lb = null;
  else if (item.weightLb !== undefined) lb = item.weightLb;
  else if (heavy && exercise.heavyWeightLb) lb = exercise.heavyWeightLb;
  else lb = defaultLb;

  return { heavy, lb, label: formatLb(lb), hold };
}

/** Short guidance under the exercise name, e.g. "8–10 slow reps" or "30s each side". */
export function repGuidance(exercise: Exercise, item: WorkoutItem, workout: Workout, workSec: number): string {
  const parts: string[] = [];
  if (item.reps) parts.push(item.reps);
  else if (isHeavy(workout, item) && exercise.equipment !== 'bodyweight') parts.push(DEFAULT_HEAVY_REPS);

  if (item.side) parts.push(item.side === 'left' ? 'Left side' : 'Right side');
  else if (exercise.perSide) parts.push(`${Math.round(workSec / 2)}s each side`);

  return parts.length ? parts.join(' · ') : 'Steady pace';
}
