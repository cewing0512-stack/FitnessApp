import type { Workout } from '../data/types';
import type { WeightInfo } from '../data/weights';
import { describeSegment, type DescribeOptions } from './describe';
import type { Segment } from './timeline';

/** "Squat to Press (Thruster)" → "Squat to Press". */
export const speakableName = (name: string) => name.replace(/\s*\(.*?\)\s*/g, ' ').trim();

export function speakWeight(w: WeightInfo | undefined): string {
  if (!w || w.lb === null) return 'bodyweight';
  if (typeof w.lb === 'number') return `${w.lb} pounds`;
  return w.lb[0] === w.lb[1] ? `${w.lb[0]} pounds` : `${w.lb[0]} to ${w.lb[1]} pounds`;
}

/**
 * What the voice says when a segment starts. Returns null for silence.
 * Examples: "Rest. Next up: Goblet Squat, 20 to 30 pounds." / "Go." / "Switch sides."
 */
export function segmentCue(segments: readonly Segment[], index: number, workout: Workout, opts: DescribeOptions): string | null {
  const seg = segments[index];
  if (!seg) return null;
  const prev = segments[index - 1];
  const info = describeSegment(seg, workout, opts);
  const name = speakableName(info.name);
  const side = info.side ? `, ${info.side} side` : '';

  switch (seg.kind) {
    case 'warmup':
      return index === 0 ? `Let's warm up. ${name}.` : `${name}.`;
    case 'cooldown':
      return prev?.kind !== 'cooldown' ? `Nice work. Time to stretch. ${name}.` : `${name}.`;
    case 'rest': {
      const next = `${name}${side}, ${speakWeight(info.weight)}.`;
      if (seg.getReady) return `Get ready. First up: ${next}`;
      const prevWork = [...segments.slice(0, index)].reverse().find((s) => s.kind === 'work');
      if (seg.round && prevWork?.round && seg.round > prevWork.round) {
        return `Round ${seg.round} of ${workout.rounds}. Next up: ${next}`;
      }
      return `Rest. Next up: ${next}`;
    }
    case 'work':
      // With rest disabled there's no preview, so name the exercise here.
      return prev?.kind === 'rest' ? 'Go.' : `${name}${side}. Go.`;
  }
}

export const HALFWAY_CUE = 'Switch sides.';
export const DONE_CUE = 'Workout complete. Great job.';
