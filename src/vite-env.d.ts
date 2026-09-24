/// <reference types="vite/client" />

declare module 'virtual:media-index' {
  /** Exercise/move ids with /videos/{id}.mp4 present. */
  export const videos: string[];
  /** Exercise/move ids with /videos/{id}.webm present. */
  export const webm: string[];
  /** Exercise/move ids with /videos/{id}.jpg present. */
  export const thumbs: string[];
}
