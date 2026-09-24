import { thumbs, videos, webm } from 'virtual:media-index';

const VIDEO = new Set(videos);
const WEBM = new Set(webm);
const THUMB = new Set(thumbs);

export interface Media {
  /** MP4 clip URL, if it exists. */
  mp4?: string;
  /** WebM clip URL, if it exists. */
  webm?: string;
  /** Poster/thumbnail URL, if it exists. */
  thumb?: string;
}

/** Demo media available for an exercise or move id (empty until videos are generated). */
export function mediaFor(id: string): Media {
  return {
    ...(VIDEO.has(id) ? { mp4: `/videos/${id}.mp4` } : {}),
    ...(WEBM.has(id) ? { webm: `/videos/${id}.webm` } : {}),
    ...(THUMB.has(id) ? { thumb: `/videos/${id}.jpg` } : {}),
  };
}

export const hasVideo = (id: string) => VIDEO.has(id) || WEBM.has(id);
