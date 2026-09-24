import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Category } from '../data/types';

export interface HistoryEntry {
  id?: number;
  workoutId: string;
  workoutName: string;
  category: Category;
  /** ISO timestamp when the workout finished. */
  completedAt: string;
  /** Time actually spent, in seconds (excludes paused time). */
  durationSec: number;
  exercisesCompleted: number;
  exercisesTotal: number;
}

interface Schema extends DBSchema {
  kv: { key: string; value: unknown };
  history: { key: number; value: HistoryEntry; indexes: { byCompletedAt: string } };
}

const DB_NAME = 'dumbbell-library';

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null;

function db() {
  dbPromise ??= openDB<Schema>(DB_NAME, 1, {
    upgrade(d) {
      d.createObjectStore('kv');
      const history = d.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
      history.createIndex('byCompletedAt', 'completedAt');
    },
  });
  return dbPromise;
}

/** For tests: close the connection so the database can be deleted. */
export async function _resetDbForTests() {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  return (await (await db()).get('kv', key)) as T | undefined;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await (await db()).put('kv', value, key);
}

export async function addHistory(entry: HistoryEntry): Promise<number> {
  const { id: _omit, ...rest } = entry;
  return (await db()).add('history', rest as HistoryEntry);
}

/** Newest first. */
export async function listHistory(): Promise<HistoryEntry[]> {
  const all = await (await db()).getAllFromIndex('history', 'byCompletedAt');
  return all.reverse();
}

export async function deleteHistory(id: number): Promise<void> {
  await (await db()).delete('history', id);
}
