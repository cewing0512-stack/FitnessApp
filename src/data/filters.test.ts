import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, filterWorkouts, isFiltered } from './filters';
import { WORKOUTS } from './library';

const none = new Set<string>();

describe('filterWorkouts', () => {
  it('returns everything with default filters', () => {
    expect(filterWorkouts(WORKOUTS, DEFAULT_FILTERS, none)).toHaveLength(WORKOUTS.length);
    expect(isFiltered(DEFAULT_FILTERS)).toBe(false);
  });

  it('filters by category', () => {
    const r = filterWorkouts(WORKOUTS, { ...DEFAULT_FILTERS, category: 'full' }, none);
    expect(r.length).toBeGreaterThanOrEqual(4);
    expect(r.every((w) => w.category === 'full')).toBe(true);
  });

  it('combines format and intensity', () => {
    const r = filterWorkouts(WORKOUTS, { ...DEFAULT_FILTERS, format: 'straight', intensity: 'standard' }, none);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((w) => w.format === 'straight' && w.intensity === 'standard')).toBe(true);
    expect(filterWorkouts(WORKOUTS, { ...DEFAULT_FILTERS, format: 'straight', intensity: 'heavy' }, none)).toEqual([]);
  });

  it('shows only favorites when asked', () => {
    const favs = new Set(['heavy-arms', 'core-ladder']);
    const r = filterWorkouts(WORKOUTS, { ...DEFAULT_FILTERS, favoritesOnly: true }, favs);
    expect(r.map((w) => w.id).sort()).toEqual(['core-ladder', 'heavy-arms']);
    expect(isFiltered({ ...DEFAULT_FILTERS, favoritesOnly: true })).toBe(true);
  });
});
