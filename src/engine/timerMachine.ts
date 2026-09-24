import type { Segment } from './timeline';

/**
 * Pure workout timer. Time is always passed in (`now`, in ms), which keeps
 * this deterministic and easy to test. The timer stores the wall-clock time the
 * current segment ends, rather than counting ticks. So if the phone throttles or
 * suspends the page, the next tick catches up exactly.
 */

export type TimerStatus = 'ready' | 'running' | 'paused' | 'done';

export interface TimerState {
  segments: readonly Segment[];
  index: number;
  status: TimerStatus;
  /** Wall-clock ms when the current segment ends (running only). */
  endsAt: number | null;
  /** Ms left in the current segment (authoritative when not running). */
  remainingMs: number;
  /** Ms spent running (excludes pauses). */
  activeMs: number;
  /** Last time activeMs was brought up to date (running only). */
  lastNow: number | null;
  /** Indexes of work segments that count as done. */
  completedWork: readonly number[];
}

export type TimerEvent =
  | { type: 'segment'; index: number; segment: Segment }
  | { type: 'countdown'; n: 3 | 2 | 1 }
  | { type: 'halfway'; index: number }
  | { type: 'done' };

export interface TickResult {
  state: TimerState;
  events: TimerEvent[];
}

/** A work block counts as done if at least this share of it was performed. */
export const COMPLETION_THRESHOLD = 0.5;

const ms = (s: Segment | undefined) => (s ? s.durationSec * 1000 : 0);

export function createTimer(segments: readonly Segment[]): TimerState {
  return {
    segments,
    index: 0,
    status: segments.length ? 'ready' : 'done',
    endsAt: null,
    remainingMs: ms(segments[0]),
    activeMs: 0,
    lastNow: null,
    completedWork: [],
  };
}

export function remainingMs(s: TimerState, now: number): number {
  if (s.status === 'running' && s.endsAt !== null) return Math.max(0, s.endsAt - now);
  return s.remainingMs;
}

/** Whole seconds shown on the clock (rounded up, so "1" shows until the very end). */
export function displaySeconds(s: TimerState, now: number): number {
  return Math.ceil(remainingMs(s, now) / 1000);
}

/** 0 → 1 progress through the current segment. */
export function segmentProgress(s: TimerState, now: number): number {
  const total = ms(s.segments[s.index]);
  return total ? 1 - remainingMs(s, now) / total : 1;
}

export function currentSegment(s: TimerState): Segment | undefined {
  return s.segments[s.index];
}

/** Total ms left in the whole workout. */
export function workoutRemainingMs(s: TimerState, now: number): number {
  if (s.status === 'done') return 0;
  let total = remainingMs(s, now);
  for (let i = s.index + 1; i < s.segments.length; i++) total += ms(s.segments[i]);
  return total;
}

function accrue(s: TimerState, now: number): TimerState {
  if (s.status !== 'running' || s.lastNow === null) return s;
  return { ...s, activeMs: s.activeMs + Math.max(0, now - s.lastNow), lastNow: now };
}

function markWorkIfDone(s: TimerState, index: number, remaining: number): TimerState {
  const seg = s.segments[index];
  if (!seg || seg.kind !== 'work' || s.completedWork.includes(index)) return s;
  const done = 1 - remaining / ms(seg);
  return done >= COMPLETION_THRESHOLD ? { ...s, completedWork: [...s.completedWork, index] } : s;
}

export function start(s: TimerState, now: number): TickResult {
  if (s.status !== 'ready') return { state: s, events: [] };
  const seg = s.segments[s.index]!;
  return {
    state: { ...s, status: 'running', endsAt: now + s.remainingMs, lastNow: now },
    events: [{ type: 'segment', index: s.index, segment: seg }],
  };
}

/**
 * Advance the clock to `now`. May cross several segments at once if the page was asleep.
 * Countdown and halfway events are only emitted for the segment that's current at `now`,
 * so the app never plays a burst of stale beeps.
 */
export function tick(s: TimerState, now: number): TickResult {
  if (s.status !== 'running' || s.endsAt === null) return { state: s, events: [] };
  const events: TimerEvent[] = [];
  const before = s.endsAt - (s.lastNow ?? now); // remaining at previous tick
  let state = accrue(s, now);
  let endsAt = state.endsAt!;
  let crossed = false;

  while (now >= endsAt) {
    state = markWorkIfDone(state, state.index, 0);
    const next = state.index + 1;
    if (next >= state.segments.length) {
      state = { ...state, status: 'done', endsAt: null, remainingMs: 0, lastNow: null };
      events.push({ type: 'done' });
      return { state, events };
    }
    endsAt += ms(state.segments[next]);
    state = { ...state, index: next, endsAt };
    crossed = true;
  }
  if (crossed) {
    // Only announce the segment we landed in.
    events.push({ type: 'segment', index: state.index, segment: state.segments[state.index]! });
  }

  const after = endsAt - now;
  const prev = crossed ? ms(state.segments[state.index]) : before;
  const seg = state.segments[state.index]!;

  // 3-2-1: fire when the displayed second changes to n.
  if (seg.durationSec > 3) {
    for (const n of [3, 2, 1] as const) {
      if (Math.ceil(prev / 1000) > n && Math.ceil(after / 1000) === n) {
        events.push({ type: 'countdown', n });
      }
    }
  }
  const half = ms(seg) / 2;
  if (prev > half && after <= half) events.push({ type: 'halfway', index: state.index });

  return { state, events };
}

export function pause(s: TimerState, now: number): TimerState {
  if (s.status !== 'running') return s;
  const a = accrue(s, now);
  return { ...a, status: 'paused', remainingMs: remainingMs(s, now), endsAt: null, lastNow: null };
}

export function resume(s: TimerState, now: number): TimerState {
  if (s.status !== 'paused') return s;
  return { ...s, status: 'running', endsAt: now + s.remainingMs, lastNow: now };
}

export function togglePause(s: TimerState, now: number): TimerState {
  return s.status === 'running' ? pause(s, now) : s.status === 'paused' ? resume(s, now) : s;
}

/** Move to segment `index` from the start. Keeps running/paused status. */
export function jumpTo(s: TimerState, index: number, now: number): TickResult {
  if (s.status === 'done' || s.status === 'ready') return { state: s, events: [] };
  let state = accrue(s, now);
  state = markWorkIfDone(state, state.index, remainingMs(s, now));
  if (index >= state.segments.length) {
    return { state: { ...state, status: 'done', endsAt: null, remainingMs: 0, lastNow: null }, events: [{ type: 'done' }] };
  }
  const i = Math.max(0, index);
  const dur = ms(state.segments[i]);
  state = {
    ...state,
    index: i,
    remainingMs: dur,
    endsAt: state.status === 'running' ? now + dur : null,
  };
  return { state, events: [{ type: 'segment', index: i, segment: state.segments[i]! }] };
}

export function skip(s: TimerState, now: number): TickResult {
  return jumpTo(s, s.index + 1, now);
}

/** Seconds into a segment after which "back" restarts it instead of going to the previous one. */
export const BACK_RESTART_SEC = 3;

/**
 * Like a music player: restart the current segment if you're more than a few seconds in,
 * otherwise go to the previous segment.
 */
export function back(s: TimerState, now: number): TickResult {
  if (s.status === 'done' || s.status === 'ready') return { state: s, events: [] };
  const elapsed = ms(s.segments[s.index]) - remainingMs(s, now);
  const target = elapsed > BACK_RESTART_SEC * 1000 || s.index === 0 ? s.index : s.index - 1;
  return jumpTo(s, target, now);
}

/** Jump past the warm-up to the get-ready rest. */
export function skipWarmup(s: TimerState, now: number): TickResult {
  const i = s.segments.findIndex((seg) => seg.kind !== 'warmup');
  return i > s.index ? jumpTo(s, i, now) : { state: s, events: [] };
}

/** Stop early. Counts the current work block if it was at least half done. */
export function end(s: TimerState, now: number): TimerState {
  if (s.status === 'done') return s;
  let state = accrue(s, now);
  if (s.status === 'running' || s.status === 'paused') state = markWorkIfDone(state, s.index, remainingMs(s, now));
  return { ...state, status: 'done', endsAt: null, remainingMs: 0, lastNow: null };
}

export function workTotal(s: TimerState): number {
  return s.segments.filter((seg) => seg.kind === 'work').length;
}
