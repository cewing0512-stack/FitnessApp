import { describe, expect, it } from 'vitest';
import { getExercise } from './exercises';
import type { Workout } from './types';
import { formatLb, repGuidance, resolveWeight } from './weights';

const workout = (intensity: Workout['intensity']): Workout => ({
  id: 'w',
  name: 'W',
  category: 'arms',
  format: 'circuit',
  intensity,
  description: '',
  rounds: 2,
  items: [],
  warmup: 'upper',
  cooldown: 'upper',
});

describe('formatLb', () => {
  it('formats numbers, ranges and bodyweight', () => {
    expect(formatLb(10)).toBe('10 lb');
    expect(formatLb([15, 25])).toBe('15–25 lb');
    expect(formatLb([20, 20])).toBe('20 lb');
    expect(formatLb(null)).toBe('Bodyweight');
  });
});

describe('resolveWeight', () => {
  const curl = getExercise('bicep-curl');
  const pushUp = getExercise('push-up');
  const goblet = getExercise('goblet-squat');

  it('uses the default dumbbell weight for standard workouts', () => {
    expect(resolveWeight(curl, { exerciseId: curl.id }, workout('standard'))).toMatchObject({
      heavy: false,
      lb: 10,
      label: '10 lb',
      hold: 'pair',
    });
    expect(resolveWeight(curl, { exerciseId: curl.id }, workout('standard'), 8).label).toBe('8 lb');
  });

  it('uses the heavy range in heavy workouts', () => {
    expect(resolveWeight(curl, { exerciseId: curl.id }, workout('heavy'))).toMatchObject({
      heavy: true,
      label: '15–20 lb',
    });
  });

  it('supports a single heavy item inside a standard workout', () => {
    const w = resolveWeight(goblet, { exerciseId: goblet.id, heavy: true }, workout('standard'));
    expect(w).toMatchObject({ heavy: true, label: '20–30 lb', hold: 'single' });
  });

  it('lets an item override the weight', () => {
    expect(resolveWeight(curl, { exerciseId: curl.id, weightLb: 12 }, workout('heavy')).label).toBe('12 lb');
  });

  it('never marks bodyweight moves heavy', () => {
    expect(resolveWeight(pushUp, { exerciseId: pushUp.id }, workout('heavy'))).toMatchObject({
      heavy: false,
      lb: null,
      label: 'Bodyweight',
      hold: 'none',
    });
  });
});

describe('repGuidance', () => {
  it('gives slow-rep guidance for heavy blocks', () => {
    const curl = getExercise('bicep-curl');
    expect(repGuidance(curl, { exerciseId: curl.id }, workout('heavy'), 60)).toBe('8–10 slow reps');
    expect(repGuidance(curl, { exerciseId: curl.id }, workout('standard'), 60)).toBe('Steady pace');
  });

  it('explains per-side timing', () => {
    const row = getExercise('single-arm-row');
    expect(repGuidance(row, { exerciseId: row.id }, workout('standard'), 60)).toBe('30s each side');
    expect(repGuidance(row, { exerciseId: row.id, side: 'right' }, workout('heavy'), 60)).toBe(
      '8–10 slow reps · Right side',
    );
  });
});
