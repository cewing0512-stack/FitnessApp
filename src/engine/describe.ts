import { getExercise } from '../data/exercises';
import { getMove } from '../data/moves';
import type { Workout } from '../data/types';
import { repGuidance, resolveWeight, type WeightInfo } from '../data/weights';
import type { Segment } from './timeline';

export interface SegmentInfo {
  /** Exercise or move id (for media). */
  id: string;
  name: string;
  cues: string[];
  /** Dumbbell exercises only. */
  weight?: WeightInfo;
  /** e.g. "8–10 slow reps · Left side". */
  guidance?: string;
  /** True if the block is split in half, switching sides midway. */
  switchSides: boolean;
  side?: 'left' | 'right';
  targetMuscles?: string[];
  mistakes?: string[];
  modification?: string;
}

export interface DescribeOptions {
  defaultLb: number;
  workSec: number;
}

/** Everything the player needs to show or say about a segment. Rests describe the NEXT exercise. */
export function describeSegment(seg: Segment, workout: Workout, opts: DescribeOptions): SegmentInfo {
  if (seg.kind === 'warmup' || seg.kind === 'cooldown') {
    const m = getMove(seg.refId);
    return { id: m.id, name: m.name, cues: m.cues, switchSides: !!m.perSide };
  }
  const ex = getExercise(seg.refId);
  const item = workout.items[seg.itemIndex ?? 0] ?? { exerciseId: ex.id };
  return {
    id: ex.id,
    name: ex.name,
    cues: ex.cues,
    weight: resolveWeight(ex, item, workout, opts.defaultLb),
    guidance: repGuidance(ex, item, workout, opts.workSec),
    switchSides: !!ex.perSide && !item.side,
    ...(item.side ? { side: item.side } : {}),
    targetMuscles: ex.targetMuscles,
    mistakes: ex.mistakes,
    modification: ex.modification,
  };
}
