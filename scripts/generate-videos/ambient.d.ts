declare module 'ffmpeg-static' {
  /** Absolute path to the bundled ffmpeg binary (null on unsupported platforms). */
  const path: string | null;
  export default path;
}
