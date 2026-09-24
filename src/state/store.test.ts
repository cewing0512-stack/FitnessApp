import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { _resetDbForTests, addHistory, deleteHistory, kvGet, listHistory } from '../db/db';
import { DEFAULT_SETTINGS, normalizeSettings } from './settings';
import { useApp } from './store';

const flush = () => new Promise((r) => setTimeout(r, 20));

beforeEach(async () => {
  await _resetDbForTests();
  await new Promise((r) => {
    indexedDB.deleteDatabase('dumbbell-library').onsuccess = r;
  });
  useApp.setState({ ready: false, settings: DEFAULT_SETTINGS, favorites: new Set() });
});

describe('normalizeSettings', () => {
  it('falls back to defaults for missing or bad values', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ workSec: 'x', restSec: -5, defaultLb: 12, voiceOn: false })).toEqual({
      ...DEFAULT_SETTINGS,
      defaultLb: 12,
      voiceOn: false,
    });
  });
});

describe('app store', () => {
  it('persists favorites and settings across a reload', async () => {
    await useApp.getState().hydrate();
    useApp.getState().toggleFavorite('heavy-arms');
    useApp.getState().toggleFavorite('core-ladder');
    useApp.getState().toggleFavorite('core-ladder');
    useApp.getState().updateSettings({ workSec: 45, defaultLb: 15 });
    await flush();

    expect(await kvGet('favorites')).toEqual(['heavy-arms']);

    // Simulate a fresh app start.
    useApp.setState({ ready: false, settings: DEFAULT_SETTINGS, favorites: new Set() });
    await useApp.getState().hydrate();
    const s = useApp.getState();
    expect(s.ready).toBe(true);
    expect([...s.favorites]).toEqual(['heavy-arms']);
    expect(s.settings).toMatchObject({ workSec: 45, restSec: 30, defaultLb: 15 });
  });
});

describe('history', () => {
  it('stores entries newest first and deletes them', async () => {
    const base = {
      workoutId: 'heavy-arms',
      workoutName: 'Heavy Arms',
      category: 'arms' as const,
      durationSec: 1700,
      exercisesCompleted: 15,
      exercisesTotal: 15,
    };
    const a = await addHistory({ ...base, completedAt: '2026-09-01T10:00:00.000Z' });
    await addHistory({ ...base, workoutName: 'Later', completedAt: '2026-09-03T10:00:00.000Z' });
    expect((await listHistory()).map((h) => h.workoutName)).toEqual(['Later', 'Heavy Arms']);
    await deleteHistory(a);
    expect(await listHistory()).toHaveLength(1);
  });
});
