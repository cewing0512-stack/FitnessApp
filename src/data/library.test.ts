import { describe, expect, it } from 'vitest';
import { EXERCISES, getExercise } from './exercises';
import { COOLDOWNS, MOVES, WARMUPS } from './moves';
import { WORKOUTS, getWorkout, summarizeWorkout } from './library';
import { validateLibrary } from './validate';
import type { Workout } from './types';

describe('seeded library', () => {
  it('passes validation', () => {
    expect(validateLibrary(WORKOUTS)).toEqual([]);
  });

  it('has 35–40 exercises and uses every one of them somewhere', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(35);
    expect(EXERCISES.length).toBeLessThanOrEqual(40);
    const used = new Set(WORKOUTS.flatMap((w) => w.items.map((i) => i.exerciseId)));
    const unused = EXERCISES.filter((e) => !used.has(e.id)).map((e) => e.id);
    expect(unused).toEqual([]);
  });

  it('uses every warm-up/cool-down move in at least one preset', () => {
    // Guards against orphaned moves that would need a video but never play.
    const used = new Set([...Object.values(WARMUPS), ...Object.values(COOLDOWNS)].flat());
    expect(MOVES.filter((m) => !used.has(m.id)).map((m) => m.id)).toEqual([]);
  });

  it('covers both formats and at least one heavy workout per category', () => {
    for (const c of ['arms', 'legs', 'upper', 'lower', 'booty', 'abs', 'full'] as const) {
      const ws = WORKOUTS.filter((w) => w.category === c);
      expect(ws.some((w) => w.intensity === 'heavy'), `${c} heavy`).toBe(true);
    }
    expect(WORKOUTS.some((w) => w.format === 'straight')).toBe(true);
    expect(WORKOUTS.some((w) => w.format === 'circuit')).toBe(true);
  });

  it('has 4–5 full-body workouts', () => {
    const n = WORKOUTS.filter((w) => w.category === 'full').length;
    expect(n).toBeGreaterThanOrEqual(4);
    expect(n).toBeLessThanOrEqual(5);
  });

  it('looks up workouts and exercises by id', () => {
    expect(getWorkout('arm-sculpt-circuit')?.name).toBe('Arm Sculpt Circuit');
    expect(getWorkout('nope')).toBeUndefined();
    expect(() => getExercise('nope')).toThrow(/Unknown exercise/);
  });
});

describe('validateLibrary catches mistakes', () => {
  const base: Workout = {
    id: 'test',
    name: 'Test',
    category: 'arms',
    format: 'circuit',
    intensity: 'standard',
    description: '',
    rounds: 3,
    items: ['bicep-curl', 'hammer-curl', 'triceps-kickback', 'lateral-raise', 'front-raise'].map((exerciseId) => ({
      exerciseId,
    })),
    warmup: 'upper',
    cooldown: 'upper',
  };
  const errorsFor = (w: Workout) => validateLibrary([...WORKOUTS, w]).filter((e) => e.includes('test'));

  it('accepts a well-formed workout', () => {
    expect(errorsFor(base)).toEqual([]);
  });

  it('flags unknown exercise ids', () => {
    expect(errorsFor({ ...base, items: [...base.items.slice(1), { exerciseId: 'bicep-curlz' }] })).toContainEqual(
      expect.stringContaining('unknown exercise "bicep-curlz"'),
    );
  });

  it('flags circuits with the wrong round count', () => {
    expect(errorsFor({ ...base, rounds: 5 })).toContainEqual(expect.stringContaining('2–3 rounds'));
  });

  it('flags repeated exercises in a straight-through workout', () => {
    const w: Workout = { ...base, format: 'straight', rounds: 1, items: [...base.items, ...base.items, ...base.items] };
    expect(errorsFor(w)).toContainEqual(expect.stringContaining('appears twice'));
  });

  it('flags workouts far from 30 minutes', () => {
    expect(errorsFor({ ...base, rounds: 2, items: base.items.slice(0, 2) })).toContainEqual(
      expect.stringContaining('outside the ~30 min target'),
    );
  });

  it('flags a side on a two-sided exercise', () => {
    const items = [{ exerciseId: 'bicep-curl', side: 'left' as const }, ...base.items.slice(1)];
    expect(errorsFor({ ...base, items })).toContainEqual(expect.stringContaining('side set on two-sided'));
  });
});

describe('summarizeWorkout', () => {
  it('reports duration, exercise count and weight for a standard circuit', () => {
    const s = summarizeWorkout(getWorkout('arm-sculpt-circuit')!);
    // 3 min warm-up + 30s get-ready + 15×60s work + 14×30s rest + 2.5 min cool-down
    expect(s.durationSec).toBe(180 + 30 + 15 * 60 + 14 * 30 + 150);
    expect(s.exerciseCount).toBe(5);
    expect(s.workBlocks).toBe(15);
    expect(s.weightLabel).toBe('10 lb');
  });

  it('shows the heavy range for heavy workouts', () => {
    const s = summarizeWorkout(getWorkout('heavy-full-body')!);
    expect(s.weightLabel).toBe('15–30 lb');
  });

  it('marks standard workouts that include a heavy block', () => {
    const s = summarizeWorkout(getWorkout('leg-day-basics')!);
    expect(s.hasHeavyItems).toBe(true);
    expect(s.weightLabel).toBe('10 lb + heavy');
  });

  it('follows the default dumbbell weight and timing settings', () => {
    const s = summarizeWorkout(getWorkout('arm-sculpt-circuit')!, { workSec: 45, restSec: 15 }, 12);
    expect(s.weightLabel).toBe('12 lb');
    expect(s.durationSec).toBe(180 + 15 + 15 * 45 + 14 * 15 + 150);
  });

  it('counts each side of a straight-through exercise once', () => {
    const s = summarizeWorkout(getWorkout('upper-body-tour')!);
    expect(s.workBlocks).toBe(16);
    expect(s.exerciseCount).toBe(15);
  });
});
