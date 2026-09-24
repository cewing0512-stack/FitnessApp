import { describe, expect, it } from 'vitest';
import { getWorkout } from '../data/library';
import { buildTimeline, formatMinutes, totalDurationSec } from './timeline';

describe('buildTimeline', () => {
  const circuit = getWorkout('arm-sculpt-circuit')!; // 5 exercises × 3 rounds

  it('orders warm-up, get-ready, alternating rest/work, then cool-down', () => {
    const t = buildTimeline(circuit);
    const kinds = t.map((s) => s.kind);
    expect(kinds.slice(0, 6)).toEqual(Array(6).fill('warmup'));
    expect(t[6]).toMatchObject({ kind: 'rest', getReady: true, refId: 'bicep-curl', round: 1, itemIndex: 0 });
    expect(kinds.slice(6, 6 + 30)).toEqual(Array.from({ length: 30 }, (_, i) => (i % 2 ? 'work' : 'rest')));
    expect(kinds.slice(-5)).toEqual(Array(5).fill('cooldown'));
    expect(t).toHaveLength(6 + 30 + 5);
  });

  it('repeats the item list per round, with rests previewing the next exercise', () => {
    const work = buildTimeline(circuit).filter((s) => s.kind === 'work');
    expect(work).toHaveLength(15);
    expect(work.map((s) => s.round)).toEqual([1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3]);
    expect(work[5]).toMatchObject({ refId: 'bicep-curl', itemIndex: 0, round: 2 });

    const t = buildTimeline(circuit);
    t.forEach((s, i) => {
      if (s.kind === 'rest') expect(t[i + 1]).toMatchObject({ kind: 'work', refId: s.refId });
    });
  });

  it('applies custom work/rest durations', () => {
    const t = buildTimeline(circuit, { workSec: 40, restSec: 20 });
    expect(t.filter((s) => s.kind === 'work').every((s) => s.durationSec === 40)).toBe(true);
    expect(t.filter((s) => s.kind === 'rest').every((s) => s.durationSec === 20)).toBe(true);
  });

  it('skips rests when rest is 0 but keeps a short get-ready', () => {
    const t = buildTimeline(circuit, { workSec: 60, restSec: 0 });
    const rests = t.filter((s) => s.kind === 'rest');
    expect(rests).toHaveLength(1);
    expect(rests[0]).toMatchObject({ getReady: true, durationSec: 10 });
  });

  it('lands every seeded workout close to 30 minutes', () => {
    const d = totalDurationSec(buildTimeline(circuit));
    expect(formatMinutes(d)).toBe('28 min');
    expect(formatMinutes(totalDurationSec(buildTimeline(getWorkout('upper-body-tour')!)))).toBe('30 min');
  });
});
