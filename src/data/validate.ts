import { EXERCISES, EXERCISE_BY_ID } from './exercises';
import { COOLDOWNS, MOVES, MOVE_BY_ID, WARMUPS } from './moves';
import { CATEGORIES, type Workout } from './types';
import { workoutDurationSec } from '../engine/timeline';

/** Target length of every workout at the default 60s work / 30s rest. */
export const DURATION_RANGE_SEC = [27 * 60, 32 * 60] as const;

/**
 * Checks the whole library for mistakes that are easy to make when editing
 * the data files by hand. Returns a list of problems; empty means all good.
 */
export function validateLibrary(workouts: Workout[]): string[] {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(msg);

  // Exercises
  const ids = new Set<string>();
  for (const e of [...EXERCISES, ...MOVES]) {
    if (ids.has(e.id)) err(`Duplicate exercise/move id: ${e.id}`);
    ids.add(e.id);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id)) err(`${e.id}: id must be kebab-case`);
    if (e.video !== `/videos/${e.id}.mp4`) err(`${e.id}: video path should be /videos/${e.id}.mp4`);
  }
  for (const e of EXERCISES) {
    if (e.cues.length < 2 || e.cues.length > 4) err(`${e.id}: needs 2–4 form cues (has ${e.cues.length})`);
    if (e.mistakes.length < 1) err(`${e.id}: needs at least one common mistake`);
    if (!e.modification.trim()) err(`${e.id}: needs an easier modification`);
    if (e.targetMuscles.length < 1) err(`${e.id}: needs target muscles`);
    if (e.motion.length < 60) err(`${e.id}: motion description is too short for a video prompt`);
    if (e.equipment !== 'bodyweight' && !e.heavyWeightLb) err(`${e.id}: dumbbell exercise needs heavyWeightLb`);
    if (e.equipment === 'bodyweight' && e.heavyWeightLb) err(`${e.id}: bodyweight exercise should not have heavyWeightLb`);
    if (e.heavyWeightLb && e.heavyWeightLb[0] > e.heavyWeightLb[1]) err(`${e.id}: heavyWeightLb range is reversed`);
  }
  if (EXERCISES.length < 35 || EXERCISES.length > 40) err(`Master list should have 35–40 exercises (has ${EXERCISES.length})`);

  // Warm-up / cool-down presets
  for (const [name, list] of Object.entries(WARMUPS)) {
    for (const id of list) if (MOVE_BY_ID[id]?.kind !== 'warmup') err(`Warm-up "${name}": ${id} is not a warm-up move`);
  }
  for (const [name, list] of Object.entries(COOLDOWNS)) {
    for (const id of list) if (MOVE_BY_ID[id]?.kind !== 'cooldown') err(`Cool-down "${name}": ${id} is not a cool-down move`);
  }

  // Workouts
  const workoutIds = new Set<string>();
  for (const w of workouts) {
    const tag = `Workout ${w.id}`;
    if (workoutIds.has(w.id)) err(`Duplicate workout id: ${w.id}`);
    workoutIds.add(w.id);
    if (!w.items.length) err(`${tag}: has no exercises`);

    for (const item of w.items) {
      if (!EXERCISE_BY_ID[item.exerciseId]) err(`${tag}: unknown exercise "${item.exerciseId}"`);
    }
    if (w.format === 'circuit' && (w.rounds < 2 || w.rounds > 3)) err(`${tag}: circuits should have 2–3 rounds`);
    if (w.format === 'straight') {
      if (w.rounds !== 1) err(`${tag}: straight-through workouts have exactly 1 round`);
      const seen = new Set<string>();
      for (const item of w.items) {
        const key = `${item.exerciseId}:${item.side ?? ''}`;
        if (seen.has(key)) err(`${tag}: "${item.exerciseId}" appears twice in a straight-through workout`);
        seen.add(key);
      }
    }
    for (const item of w.items) {
      const ex = EXERCISE_BY_ID[item.exerciseId];
      if (item.side && ex && !ex.perSide) err(`${tag}: side set on two-sided exercise ${item.exerciseId}`);
    }

    if (!w.items.some((i) => !EXERCISE_BY_ID[i.exerciseId])) {
      const d = workoutDurationSec(w);
      if (d < DURATION_RANGE_SEC[0] || d > DURATION_RANGE_SEC[1]) {
        err(`${tag}: ${Math.round(d / 60)} min is outside the ~30 min target`);
      }
    }
  }

  for (const c of CATEGORIES) {
    const n = workouts.filter((w) => w.category === c).length;
    const min = c === 'full' ? 4 : 3;
    if (n < min) err(`Category ${c}: needs at least ${min} workouts (has ${n})`);
  }

  return errors;
}
