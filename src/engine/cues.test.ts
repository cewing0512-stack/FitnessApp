import { describe, expect, it } from 'vitest';
import { getWorkout } from '../data/library';
import { segmentCue, speakWeight, speakableName } from './cues';
import { describeSegment } from './describe';
import { buildTimeline } from './timeline';

const opts = { defaultLb: 10, workSec: 60 };

describe('segmentCue', () => {
  const w = getWorkout('heavy-arms')!;
  const t = buildTimeline(w);
  const cue = (i: number) => segmentCue(t, i, w, opts);
  const firstRest = t.findIndex((s) => s.kind === 'rest');

  it('opens the warm-up and names each move', () => {
    expect(cue(0)).toBe("Let's warm up. March in Place.");
    expect(cue(1)).toBe('Shoulder Rolls.');
  });

  it('announces the first exercise and its weight in the get-ready', () => {
    expect(cue(firstRest)).toBe('Get ready. First up: Bicep Curl, 15 to 20 pounds.');
    expect(cue(firstRest + 1)).toBe('Go.');
  });

  it('previews the next exercise during rest', () => {
    expect(cue(firstRest + 2)).toBe('Rest. Next up: Floor Skull Crusher, 12 to 20 pounds.');
  });

  it('calls out a new round', () => {
    const i = t.findIndex((s) => s.kind === 'rest' && s.round === 2);
    expect(cue(i)).toBe('Round 2 of 3. Next up: Bicep Curl, 15 to 20 pounds.');
  });

  it('starts the stretch after the last exercise', () => {
    const i = t.findIndex((s) => s.kind === 'cooldown');
    expect(cue(i)).toBe('Nice work. Time to stretch. Chest Opener.');
    expect(cue(i + 1)).toBe('Cross-Body Shoulder Stretch.');
  });

  it('names sides and bodyweight moves', () => {
    const tour = getWorkout('upper-body-tour')!;
    const tt = buildTimeline(tour);
    const i = tt.findIndex((s) => s.kind === 'rest' && s.refId === 'single-arm-row');
    expect(segmentCue(tt, i, tour, opts)).toBe('Rest. Next up: Single-Arm Row, left side, 10 pounds.');
    const p = tt.findIndex((s) => s.kind === 'rest' && s.refId === 'push-up');
    expect(segmentCue(tt, p, tour, opts)).toBe('Rest. Next up: Push-Up, bodyweight.');
  });

  it('names the exercise at work start when rest is turned off', () => {
    const tt = buildTimeline(w, { workSec: 60, restSec: 0 });
    const works = tt.map((s, i) => [s, i] as const).filter(([s]) => s.kind === 'work');
    expect(segmentCue(tt, works[0]![1], w, opts)).toBe('Go.'); // still has get-ready
    expect(segmentCue(tt, works[1]![1], w, opts)).toBe('Floor Skull Crusher. Go.');
  });
});

describe('helpers', () => {
  it('strips parentheses and speaks weights', () => {
    expect(speakableName('Squat to Press (Thruster)')).toBe('Squat to Press');
    expect(speakWeight({ heavy: false, lb: 10, label: '', hold: 'pair' })).toBe('10 pounds');
    expect(speakWeight({ heavy: true, lb: [15, 25], label: '', hold: 'pair' })).toBe('15 to 25 pounds');
    expect(speakWeight(undefined)).toBe('bodyweight');
  });

  it('describes per-side switching', () => {
    const w = getWorkout('heavy-upper-body')!;
    const t = buildTimeline(w);
    const row = t.find((s) => s.kind === 'work' && s.refId === 'single-arm-row')!;
    expect(describeSegment(row, w, opts)).toMatchObject({ switchSides: true, guidance: '8–10 slow reps · 30s each side' });
    const tour = getWorkout('upper-body-tour')!;
    const left = buildTimeline(tour).find((s) => s.kind === 'work' && s.refId === 'single-arm-row')!;
    expect(describeSegment(left, tour, opts)).toMatchObject({ switchSides: false, side: 'left' });
  });
});
