import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import ffmpegStatic from 'ffmpeg-static';

const run = promisify(execFile);
const FFMPEG = process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg';

/** Output frame size: 720×1280 (9:16). Sharp on phones, small on disk. */
const W = 720;
const H = 1280;
/** Seconds of cross-fade used to smooth the loop point. Kept short to avoid "ghosting". */
export const LOOP_FADE_SEC = 0.2;

export interface CompressOptions {
  /** Also write a VP9 WebM (smaller, but MP4 alone plays everywhere). */
  webm?: boolean;
  /** Blend the end into the start so the loop has no visible jump. */
  loopBlend?: boolean;
}

export async function probeDuration(file: string): Promise<number> {
  // ffmpeg prints "Duration: 00:00:08.04" to stderr and exits non-zero with no output file.
  const { stderr } = await run(FFMPEG, ['-hide_banner', '-i', file]).catch((e: { stderr: string }) => ({ stderr: e.stderr }));
  const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr ?? '');
  if (!m) throw new Error(`Could not read duration of ${file}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/**
 * Finds where to cut the clip so it loops cleanly: the moment in the second half
 * that looks most like the first frame (she's back in the start position).
 * Compares tiny grayscale thumbnails of every frame.
 */
export async function findLoopEnd(file: string, durationSec: number): Promise<number> {
  const FPS = 15;
  const w = 36;
  const h = 64;
  const { stdout } = await run(
    FFMPEG,
    ['-hide_banner', '-loglevel', 'error', '-i', file, '-vf', `fps=${FPS},scale=${w}:${h},format=gray`, '-f', 'rawvideo', '-'],
    { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 },
  );
  const size = w * h;
  const frames = Math.floor(stdout.length / size);
  if (frames < 4) return durationSec;
  const first = stdout.subarray(0, size);
  let best = frames - 1;
  let bestErr = Infinity;
  for (let i = Math.max(1, Math.floor(frames * 0.5)); i < frames; i++) {
    let err = 0;
    for (let p = 0; p < size; p++) {
      const d = stdout[i * size + p]! - first[p]!;
      err += d * d;
    }
    // Prefer later frames slightly, so more of the movement is kept.
    err *= 1 - 0.1 * (i / frames);
    if (err < bestErr) {
      bestErr = err;
      best = i;
    }
  }
  return Math.min(durationSec, (best + 1) / FPS);
}

/**
 * The filter graph for one clip. The source is cut at `loopEndSec` (the frame
 * that best matches the start). With blending, the output starts F seconds in and its
 * last F seconds cross-fade into the first F seconds, so the loop has no visible jump.
 */
export function videoFilter(loopEndSec: number, loopBlend: boolean): string {
  const fit = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=30,format=yuv420p`;
  const F = LOOP_FADE_SEC;
  const cut = `trim=end=${loopEndSec.toFixed(3)},setpts=PTS-STARTPTS,`;
  if (!loopBlend || loopEndSec < 4 * F + 1) return `[0:v]${loopBlend ? cut : ''}${fit}[v]`;
  const offset = (loopEndSec - 2 * F).toFixed(3);
  return [
    `[0:v]${cut}${fit},split[a][b]`,
    `[a]trim=start=${F},setpts=PTS-STARTPTS,fps=30[main]`,
    `[b]trim=end=${F},setpts=PTS-STARTPTS,fps=30[head]`,
    `[main][head]xfade=transition=fade:duration=${F}:offset=${offset},format=yuv420p[v]`,
  ].join(';');
}

/**
 * Turns a raw clip into the files the app serves:
 *   {outDir}/{id}.mp4   H.264, no audio, fast-start (streams immediately)
 *   {outDir}/{id}.webm  optional VP9
 *   {outDir}/{id}.jpg   poster/thumbnail
 */
export async function compressClip(input: string, outDir: string, id: string, opts: CompressOptions = {}) {
  await fs.mkdir(outDir, { recursive: true });
  const duration = await probeDuration(input);
  const loopBlend = opts.loopBlend ?? true;
  const loopEnd = loopBlend ? await findLoopEnd(input, duration) : duration;
  const filter = videoFilter(loopEnd, loopBlend);
  const mp4 = path.join(outDir, `${id}.mp4`);
  const tmp = `${mp4}.tmp.mp4`;

  await run(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', input,
    '-filter_complex', filter, '-map', '[v]',
    '-an',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow',
    '-crf', '28', '-maxrate', '1500k', '-bufsize', '3000k',
    '-movflags', '+faststart',
    tmp,
  ]);
  await fs.rename(tmp, mp4);

  if (opts.webm) {
    await run(FFMPEG, [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-i', mp4,
      '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-an',
      path.join(outDir, `${id}.webm`),
    ]);
  }

  await run(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-ss', '0.2', '-i', mp4,
    '-frames:v', '1', '-vf', 'scale=360:640', '-q:v', '4',
    path.join(outDir, `${id}.jpg`),
  ]);

  const sizes = await Promise.all([mp4, path.join(outDir, `${id}.jpg`)].map((f) => fs.stat(f).then((s) => s.size)));
  return { mp4, durationSec: duration, mp4Bytes: sizes[0]!, jpgBytes: sizes[1]! };
}
