import { EXERCISES } from '../data/exercises';
import { MOVES } from '../data/moves';
import { mediaFor } from '../data/media';

/** Must match VIDEO_CACHE in vite.config.ts. */
export const VIDEO_CACHE = 'demo-videos';

const hasCaches = () => typeof caches !== 'undefined';

/**
 * Saves a clip in full to the offline cache. <video> only ever requests byte
 * ranges, which the service worker can't store, so the app fetches the whole file
 * once after the first play. Afterwards the service worker serves ranges from it.
 */
export async function cacheVideo(url: string): Promise<void> {
  if (!hasCaches() || !url) return;
  const path = new URL(url, location.href).pathname;
  try {
    const cache = await caches.open(VIDEO_CACHE);
    if (await cache.match(path)) return;
    await cache.add(path);
  } catch {
    // Offline or storage full. It will be tried again on the next play.
  }
}

/** The clip URL this browser would play for an id (WebM if supported, else MP4). */
function preferredClip(id: string): string | undefined {
  const m = mediaFor(id);
  const canWebm = typeof document !== 'undefined' && document.createElement('video').canPlayType('video/webm') !== '';
  return (canWebm && m.webm) || m.mp4 || m.webm;
}

export function allClips(): string[] {
  return [...EXERCISES, ...MOVES].map((e) => preferredClip(e.id)).filter((u): u is string => !!u);
}

export async function countCachedClips(): Promise<number> {
  if (!hasCaches()) return 0;
  const cache = await caches.open(VIDEO_CACHE);
  const keys = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
  return allClips().filter((u) => keys.has(u)).length;
}

/** Downloads every demo clip for offline use. Reports progress as (done, total). */
export async function cacheAllClips(onProgress: (done: number, total: number) => void): Promise<number> {
  const clips = allClips();
  await requestPersistentStorage();
  let done = 0;
  onProgress(0, clips.length);
  for (const url of clips) {
    await cacheVideo(url);
    onProgress(++done, clips.length);
  }
  return countCachedClips();
}

/** Asks the browser not to evict our caches under storage pressure (best effort). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
