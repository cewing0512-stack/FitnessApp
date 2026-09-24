import type { Category, Intensity, Workout, WorkoutFormat } from './types';

export interface LibraryFilters {
  category: Category | 'all';
  format: WorkoutFormat | 'all';
  intensity: Intensity | 'all';
  favoritesOnly: boolean;
}

export const DEFAULT_FILTERS: LibraryFilters = {
  category: 'all',
  format: 'all',
  intensity: 'all',
  favoritesOnly: false,
};

export function filterWorkouts(workouts: Workout[], f: LibraryFilters, favorites: ReadonlySet<string>): Workout[] {
  return workouts.filter(
    (w) =>
      (f.category === 'all' || w.category === f.category) &&
      (f.format === 'all' || w.format === f.format) &&
      (f.intensity === 'all' || w.intensity === f.intensity) &&
      (!f.favoritesOnly || favorites.has(w.id)),
  );
}

export function isFiltered(f: LibraryFilters): boolean {
  return f.category !== 'all' || f.format !== 'all' || f.intensity !== 'all' || f.favoritesOnly;
}
