import { useMemo } from 'react';
import { Chip } from '../components/Chip';
import { HeartIcon, FlameIcon } from '../components/icons';
import { WorkoutCard } from '../components/WorkoutCard';
import { filterWorkouts, isFiltered } from '../data/filters';
import { WORKOUTS, summarizeWorkout } from '../data/library';
import { CATEGORIES, CATEGORY_LABELS } from '../data/types';
import { useApp } from '../state/store';

export function Library() {
  const { filters, setFilters, resetFilters, favorites, toggleFavorite, settings } = useApp();

  const results = useMemo(() => filterWorkouts(WORKOUTS, filters, favorites), [filters, favorites]);
  const timing = { workSec: settings.workSec, restSec: settings.restSec };

  return (
    <div className="pb-28">
      <header className="mx-auto max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="text-[34px] font-bold tracking-tight">Library</h1>
        <p className="text-[15px] text-white/50">Pick a workout. About 30 minutes each.</p>
      </header>

      <div className="sticky top-0 z-20 mt-4 border-b border-line/60 bg-ink/85 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="no-scrollbar mx-auto flex max-w-xl gap-2 overflow-x-auto px-4">
          <Chip selected={filters.category === 'all'} onClick={() => setFilters({ category: 'all' })}>
            All
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} selected={filters.category === c} onClick={() => setFilters({ category: c })}>
              {CATEGORY_LABELS[c]}
            </Chip>
          ))}
        </div>
        <div className="no-scrollbar mx-auto mt-2 flex max-w-xl items-center gap-2 overflow-x-auto px-4">
          <Chip tone="fav" selected={filters.favoritesOnly} onClick={() => setFilters({ favoritesOnly: !filters.favoritesOnly })}>
            <HeartIcon filled={filters.favoritesOnly} className="size-4" />
            Favorites
          </Chip>
          <span className="mx-1 h-6 w-px shrink-0 bg-line" />
          <Chip
            selected={filters.format === 'circuit'}
            onClick={() => setFilters({ format: filters.format === 'circuit' ? 'all' : 'circuit' })}
          >
            Circuit
          </Chip>
          <Chip
            selected={filters.format === 'straight'}
            onClick={() => setFilters({ format: filters.format === 'straight' ? 'all' : 'straight' })}
          >
            Straight
          </Chip>
          <span className="mx-1 h-6 w-px shrink-0 bg-line" />
          <Chip
            selected={filters.intensity === 'standard'}
            onClick={() => setFilters({ intensity: filters.intensity === 'standard' ? 'all' : 'standard' })}
          >
            {settings.defaultLb} lb
          </Chip>
          <Chip
            tone="heavy"
            selected={filters.intensity === 'heavy'}
            onClick={() => setFilters({ intensity: filters.intensity === 'heavy' ? 'all' : 'heavy' })}
          >
            <FlameIcon className="size-4" />
            Heavy
          </Chip>
        </div>
      </div>

      <main className="mx-auto max-w-xl px-4">
        <div className="flex h-12 items-center justify-between text-sm text-white/45">
          <span>
            {results.length} {results.length === 1 ? 'workout' : 'workouts'}
          </span>
          {isFiltered(filters) && (
            <button type="button" onClick={resetFilters} className="-mr-2 h-10 px-2 font-medium text-white/70">
              Clear filters
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <EmptyState favoritesOnly={filters.favoritesOnly} onReset={resetFilters} />
        ) : (
          <ul className="grid gap-3">
            {results.map((w) => (
              <li key={w.id}>
                <WorkoutCard
                  workout={w}
                  summary={summarizeWorkout(w, timing, settings.defaultLb)}
                  favorite={favorites.has(w.id)}
                  onToggleFavorite={() => toggleFavorite(w.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function EmptyState({ favoritesOnly, onReset }: { favoritesOnly: boolean; onReset: () => void }) {
  return (
    <div className="mt-10 rounded-3xl border border-dashed border-line px-6 py-12 text-center">
      {favoritesOnly ? (
        <>
          <HeartIcon className="mx-auto size-8 text-fav" />
          <p className="mt-3 text-lg font-medium">No favorites here yet</p>
          <p className="mt-1 text-white/50">Tap the heart on any workout to save it.</p>
        </>
      ) : (
        <p className="text-lg font-medium">No workouts match these filters</p>
      )}
      <button type="button" onClick={onReset} className="mt-5 h-11 rounded-full bg-surface-2 px-5 font-medium">
        Show all workouts
      </button>
    </div>
  );
}
