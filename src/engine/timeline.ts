import { COOLDOWNS, MOVE_SEC, WARMUPS } from '../data/moves';
import type { TimingSettings, Workout } from '../data/types';

export const DEFAULT_TIMING: TimingSettings = { workSec: 60, restSec: 30 };

export type SegmentKind = 'warmup' | 'rest' | 'work' | 'cooldown';

export interface Segment {
  kind: SegmentKind;
  durationSec: number;
  /** Exercise id (work), move id (warmup/cooldown), or the upcoming exercise id (rest). */
  refId: string;
  /** Index into workout.items, for work and rest segments. */
  itemIndex?: number;
  /** 1-based round, for work and rest segments. */
  round?: number;
  /** For rest: true for the "get ready" rest right after the warm-up. */
  getReady?: boolean;
}

/**
 * Flattens a workout into the ordered list of timed segments the player runs:
 *
 *   warm-up moves → get-ready rest → work → rest → work → … → work → cool-down moves
 *
 * Each rest points at the NEXT exercise, so the player can preview it.
 * Rounds run back to back, with the normal rest between them.
 */
export function buildTimeline(workout: Workout, timing: TimingSettings = DEFAULT_TIMING): Segment[] {
  const segments: Segment[] = [];

  for (const id of WARMUPS[workout.warmup]) {
    segments.push({ kind: 'warmup', durationSec: MOVE_SEC, refId: id });
  }

  let first = true;
  for (let round = 1; round <= workout.rounds; round++) {
    workout.items.forEach((item, itemIndex) => {
      if (timing.restSec > 0 || first) {
        segments.push({
          kind: 'rest',
          durationSec: first ? Math.max(timing.restSec, 10) : timing.restSec,
          refId: item.exerciseId,
          itemIndex,
          round,
          ...(first ? { getReady: true } : {}),
        });
      }
      first = false;
      segments.push({ kind: 'work', durationSec: timing.workSec, refId: item.exerciseId, itemIndex, round });
    });
  }

  for (const id of COOLDOWNS[workout.cooldown]) {
    segments.push({ kind: 'cooldown', durationSec: MOVE_SEC, refId: id });
  }

  return segments;
}

export function totalDurationSec(segments: Segment[]): number {
  return segments.reduce((sum, s) => sum + s.durationSec, 0);
}

export function workoutDurationSec(workout: Workout, timing: TimingSettings = DEFAULT_TIMING): number {
  return totalDurationSec(buildTimeline(workout, timing));
}

/** "29 min" (rounded to the nearest minute). */
export function formatMinutes(sec: number): string {
  return `${Math.round(sec / 60)} min`;
}
