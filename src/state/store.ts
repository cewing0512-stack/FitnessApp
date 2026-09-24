import { create } from 'zustand';
import { kvGet, kvSet } from '../db/db';
import { DEFAULT_FILTERS, type LibraryFilters } from '../data/filters';
import { DEFAULT_SETTINGS, normalizeSettings, type Settings } from './settings';

interface AppState {
  /** True once settings and favorites have loaded from IndexedDB. */
  ready: boolean;
  settings: Settings;
  favorites: ReadonlySet<string>;
  /** Library filters live in memory so they survive navigating to a workout and back. */
  filters: LibraryFilters;

  hydrate: () => Promise<void>;
  toggleFavorite: (workoutId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setFilters: (patch: Partial<LibraryFilters>) => void;
  resetFilters: () => void;
}

const persist = (key: string, value: unknown) => {
  kvSet(key, value).catch((e) => console.warn(`Could not save ${key}`, e));
};

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  settings: DEFAULT_SETTINGS,
  favorites: new Set(),
  filters: DEFAULT_FILTERS,

  hydrate: async () => {
    try {
      const [settings, favorites] = await Promise.all([kvGet('settings'), kvGet<string[]>('favorites')]);
      set({
        settings: normalizeSettings(settings),
        favorites: new Set(Array.isArray(favorites) ? favorites : []),
      });
    } catch (e) {
      // Private browsing or storage blocked — run with defaults in memory.
      console.warn('IndexedDB unavailable, using defaults', e);
    }
    set({ ready: true });
  },

  toggleFavorite: (id) => {
    const next = new Set(get().favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ favorites: next });
    persist('favorites', [...next]);
  },

  updateSettings: (patch) => {
    const settings = normalizeSettings({ ...get().settings, ...patch });
    set({ settings });
    persist('settings', settings);
  },

  setFilters: (patch) => set({ filters: { ...get().filters, ...patch } }),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
