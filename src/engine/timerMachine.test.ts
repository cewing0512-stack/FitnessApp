import { describe, expect, it } from 'vitest';
import type { Segment } from './timeline';
import { buildTimeline } from './timeline';
import { getWorkout } from '../data/library';
import {
  back,
  createTimer,
  displaySeconds,
  end,
  jumpTo,
  pause,
  remainingMs,
  resume,
  segmentProgress,
  skip,
  skipWarmup,
  start,
  tick,
  togglePause,
  workTotal,
  workoutRemainingMs,
  type TimerEvent,
  type TimerState,
} from './timerMachine';

const T0 = 1_000_000;
const sec = (n: number) => n * 1000;

/** Tiny circuit: get-ready 10s, then 2 exercises × 2 rounds of 60/30. */
const seg = (kind: Segment['kind'], durationSec: number, refId: string, round?: number): Segment => ({
  kind,
  durationSec,
  refId,
  ...(round ? { round } : {}),
});
const SEGMENTS: Segment[] = [
  seg('rest', 10, 'a', 1), // 0 get ready
  seg('work', 60, 'a', 1), // 1
  seg('rest', 30, 'b', 1), // 2
  seg('work', 60, 'b', 1), // 3
  seg('rest', 30, 'a', 2), // 4
  seg('work', 60, 'a', 2), // 5
  seg('rest', 30, 'b', 2), // 6
  seg('work', 60, 'b', 2), // 7
];

function started(): TimerState {
  return start(createTimer(SEGMENTS), T0).state;
}

/** Tick every 100ms from `from` to `to`, collecting events. */
function run(s: TimerState, from: number, to: number, step = 100): { state: TimerState; events: TimerEvent[] } {
  const events: TimerEvent[] = [];
  let state = s;
  for (let t = from + step; t <= to; t += step) {
    const r = tick(state, t);
    state = r.state;
    events.push(...r.events);
  }
  return { state, events };
}

describe('start', () => {
  it('begins at the first segment and announces it', () => {
    const s0 = createTimer(SEGMENTS);
    expect(s0.status).toBe('ready');
    expect(displaySeconds(s0, T0)).toBe(10);
    const { state, events } = start(s0, T0);
    expect(state.status).toBe('running');
    expect(events).toEqual([{ type: 'segment', index: 0, segment: SEGMENTS[0] }]);
    expect(start(state, T0 + 5).state).toBe(state); // start twice is a no-op
  });

  it('treats an empty timeline as already done', () => {
    expect(createTimer([]).status).toBe('done');
  });
});

describe('work/rest transitions', () => {
  it('counts down and moves rest → work → rest at the right times', () => {
    let s = started();
    expect(displaySeconds(s, T0 + 100)).toBe(10);
    expect(displaySeconds(s, T0 + sec(9.5))).toBe(1);

    let r = tick(s, T0 + sec(10));
    expect(r.state.index).toBe(1);
    expect(r.state.segments[r.state.index]!.kind).toBe('work');
    expect(r.events).toContainEqual({ type: 'segment', index: 1, segment: SEGMENTS[1] });
    expect(displaySeconds(r.state, T0 + sec(10))).toBe(60);

    s = r.state;
    r = tick(s, T0 + sec(70));
    expect(r.state.index).toBe(2);
    expect(r.state.segments[2]!.kind).toBe('rest');
    expect(r.state.segments[2]!.refId).toBe('b'); // rest previews the next exercise
  });

  it('runs every round and finishes', () => {
    const { state, events } = run(started(), T0, T0 + sec(10 + 4 * 60 + 3 * 30));
    expect(state.status).toBe('done');
    expect(events.filter((e) => e.type === 'segment').map((e) => (e as { index: number }).index)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(events.at(-1)).toEqual({ type: 'done' });
    // Round numbers step from 1 to 2.
    expect(state.segments.filter((x) => x.kind === 'work').map((x) => x.round)).toEqual([1, 1, 2, 2]);
    expect(state.completedWork).toEqual([1, 3, 5, 7]);
    expect(state.activeMs).toBe(sec(340));
  });

  it('keeps exact time when ticks are late (no drift)', () => {
    let s = started();
    s = tick(s, T0 + sec(10) + 437).state; // late tick into work
    expect(s.index).toBe(1);
    expect(remainingMs(s, T0 + sec(10) + 437)).toBe(sec(60) - 437);
  });

  it('catches up across several segments after the page sleeps', () => {
    const s = started();
    const { state, events } = tick(s, T0 + sec(10 + 60 + 30 + 20)); // 20s into work #3
    expect(state.index).toBe(3);
    expect(displaySeconds(state, T0 + sec(120))).toBe(40);
    // Only the landing segment is announced; no stale countdown beeps.
    expect(events).toEqual([{ type: 'segment', index: 3, segment: SEGMENTS[3] }]);
    expect(state.completedWork).toEqual([1]);
  });

  it('finishes cleanly if the page sleeps past the end', () => {
    const { state, events } = tick(started(), T0 + sec(10_000));
    expect(state.status).toBe('done');
    expect(events).toEqual([{ type: 'done' }]);
    expect(state.completedWork).toEqual([1, 3, 5, 7]);
  });
});

describe('countdown and halfway cues', () => {
  it('beeps 3-2-1 once each at the end of a segment', () => {
    const s = tick(started(), T0 + sec(10)).state; // into first work
    const { events } = run(s, T0 + sec(10), T0 + sec(69.9));
    expect(events.filter((e) => e.type === 'countdown')).toEqual([
      { type: 'countdown', n: 3 },
      { type: 'countdown', n: 2 },
      { type: 'countdown', n: 1 },
    ]);
  });

  it('only beeps the numbers actually reached when ticks are sparse', () => {
    const s = tick(started(), T0 + sec(10)).state;
    const r1 = tick(s, T0 + sec(66.5)); // 3.5s left: display 4
    expect(r1.events).toEqual([{ type: 'halfway', index: 1 }]);
    const r2 = tick(r1.state, T0 + sec(68.5)); // 1.5s left: display 2
    expect(r2.events).toEqual([{ type: 'countdown', n: 2 }]);
  });

  it('signals halfway once (used for "switch sides")', () => {
    const s = tick(started(), T0 + sec(10)).state;
    const { events } = run(s, T0 + sec(10), T0 + sec(69.9));
    expect(events.filter((e) => e.type === 'halfway')).toEqual([{ type: 'halfway', index: 1 }]);
  });

  it('does not beep for segments of 3s or less', () => {
    const s = start(createTimer([seg('work', 3, 'a'), seg('work', 60, 'b')]), T0).state;
    const { events } = run(s, T0, T0 + sec(2.9));
    expect(events.filter((e) => e.type === 'countdown')).toEqual([]);
  });
});

describe('pause / resume', () => {
  it('freezes the clock while paused and resumes where it left off', () => {
    let s = tick(started(), T0 + sec(10)).state; // work, 60s left
    s = pause(s, T0 + sec(25)); // 45s left
    expect(s.status).toBe('paused');
    expect(displaySeconds(s, T0 + sec(25))).toBe(45);
    expect(displaySeconds(s, T0 + sec(500))).toBe(45);
    expect(tick(s, T0 + sec(500)).state).toBe(s); // ticks are ignored

    s = resume(s, T0 + sec(500));
    expect(s.status).toBe('running');
    expect(displaySeconds(s, T0 + sec(510))).toBe(35);
    const r = tick(s, T0 + sec(545));
    expect(r.state.index).toBe(2);
  });

  it('excludes paused time from active time', () => {
    let s = started();
    s = pause(s, T0 + sec(5));
    s = resume(s, T0 + sec(1000));
    s = end(s, T0 + sec(1003));
    expect(s.activeMs).toBe(sec(8));
  });

  it('togglePause flips between states and ignores ready/done', () => {
    const s = started();
    expect(togglePause(s, T0 + 1).status).toBe('paused');
    expect(togglePause(togglePause(s, T0 + 1), T0 + 2).status).toBe('running');
    const ready = createTimer(SEGMENTS);
    expect(togglePause(ready, T0)).toBe(ready);
  });

  it('pause and resume are no-ops in the wrong state', () => {
    const s = started();
    expect(resume(s, T0)).toBe(s);
    const p = pause(s, T0 + 1);
    expect(pause(p, T0 + 2)).toBe(p);
  });
});

describe('skip', () => {
  it('jumps to the next segment with a full clock', () => {
    const s = started();
    const r = skip(s, T0 + sec(2));
    expect(r.state.index).toBe(1);
    expect(displaySeconds(r.state, T0 + sec(2))).toBe(60);
    expect(r.events).toEqual([{ type: 'segment', index: 1, segment: SEGMENTS[1] }]);
  });

  it('skipping while paused stays paused on the new segment', () => {
    let s = pause(started(), T0 + sec(2));
    s = skip(s, T0 + sec(3)).state;
    expect(s.status).toBe('paused');
    expect(s.index).toBe(1);
    expect(displaySeconds(s, T0 + sec(99))).toBe(60);
  });

  it('counts a skipped work block only if at least half was done', () => {
    let s = skip(started(), T0).state; // work #1 starts at T0
    s = skip(s, T0 + sec(20)).state; // 20/60 done → not counted
    expect(s.completedWork).toEqual([]);
    s = skip(s, T0 + sec(21)).state; // rest → work #3 at T0+21
    s = skip(s, T0 + sec(51)).state; // 30/60 done → counted
    expect(s.completedWork).toEqual([3]);
  });

  it('skipping the last segment finishes the workout', () => {
    let s = started();
    s = jumpTo(s, SEGMENTS.length - 1, T0).state;
    const r = skip(s, T0 + sec(1));
    expect(r.state.status).toBe('done');
    expect(r.events).toEqual([{ type: 'done' }]);
  });

  it('skipWarmup jumps to the get-ready rest', () => {
    const t = buildTimeline(getWorkout('arm-sculpt-circuit')!);
    let s = start(createTimer(t), T0).state;
    s = skip(s, T0 + sec(5)).state; // second warm-up move
    const r = skipWarmup(s, T0 + sec(6));
    expect(r.state.segments[r.state.index]).toMatchObject({ kind: 'rest', getReady: true });
    expect(skipWarmup(r.state, T0 + sec(7)).state).toBe(r.state); // no-op once past warm-up
  });
});

describe('back', () => {
  it('restarts the current segment if more than 3s in', () => {
    let s = tick(started(), T0 + sec(10)).state; // work #1
    const r = back(s, T0 + sec(30));
    expect(r.state.index).toBe(1);
    expect(displaySeconds(r.state, T0 + sec(30))).toBe(60);
    s = r.state;
    expect(s.status).toBe('running');
  });

  it('goes to the previous segment if within the first 3s', () => {
    const s = tick(started(), T0 + sec(10)).state; // work #1 just began
    const r = back(s, T0 + sec(12));
    expect(r.state.index).toBe(0);
    expect(displaySeconds(r.state, T0 + sec(12))).toBe(10);
  });

  it('can walk back across a round boundary', () => {
    let s = started();
    s = jumpTo(s, 5, T0).state; // round 2, first work
    expect(s.segments[s.index]!.round).toBe(2);
    s = back(s, T0 + sec(1)).state; // → rest before it
    s = back(s, T0 + sec(2)).state; // → round 1, last work
    expect(s.index).toBe(3);
    expect(s.segments[s.index]!.round).toBe(1);
  });

  it('stays on the first segment', () => {
    const r = back(started(), T0 + sec(1));
    expect(r.state.index).toBe(0);
  });
});

describe('end and totals', () => {
  it('ends early, counting a half-done current block', () => {
    let s = tick(started(), T0 + sec(10)).state;
    s = end(s, T0 + sec(45)); // 35/60 of work #1
    expect(s.status).toBe('done');
    expect(s.completedWork).toEqual([1]);
    expect(end(s, T0 + sec(99))).toBe(s);
  });

  it('reports progress and time left in the workout', () => {
    const s = tick(started(), T0 + sec(10)).state;
    expect(segmentProgress(s, T0 + sec(40))).toBeCloseTo(0.5);
    expect(workoutRemainingMs(s, T0 + sec(40))).toBe(sec(30 + 30 + 60 + 30 + 60 + 30 + 60));
    expect(workTotal(s)).toBe(4);
  });

  it('runs a real seeded workout end to end', () => {
    const t = buildTimeline(getWorkout('heavy-arms')!);
    const total = t.reduce((a, x) => a + x.durationSec, 0);
    const { state } = run(start(createTimer(t), T0).state, T0, T0 + sec(total), 1000);
    expect(state.status).toBe('done');
    expect(state.completedWork).toHaveLength(15);
  });
});
