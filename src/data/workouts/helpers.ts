import type { WorkoutItem } from '../types';

/** Shorthand for item lists: a plain id string, or a full WorkoutItem. */
export const items = (...list: (string | WorkoutItem)[]): WorkoutItem[] =>
  list.map((i) => (typeof i === 'string' ? { exerciseId: i } : i));

/** Two back-to-back full work blocks for a one-sided exercise (left, then right). */
export const bothSides = (exerciseId: string): WorkoutItem[] => [
  { exerciseId, side: 'left' },
  { exerciseId, side: 'right' },
];
