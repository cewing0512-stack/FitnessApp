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
/** Seconds of cross-fade used to make the end flow back into the start. */
export const LOOP_FADE_SEC = 0.4;

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
 * The filter graph for one clip. With loop blending, the output starts at
 * F seconds in, and its last F seconds cross-fade into the first F seconds of
 * the source. So the final frame matches the first frame and the clip loops seamlessly.
 */
export function videoFilter(durationSec: number, loopBlend: boolean): string {
  const fit = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=30,format=yuv420p`;
  const F = LOOP_FADE_SEC;
  if (!loopBlend || durationSec < 4 * F + 1) return `[0:v]${fit}[v]`;
  const offset = (durationSec - 2 * F).toFixed(3);
  return [
    `[0:v]${fit},split[a][b]`,
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
  const filter = videoFilter(duration, opts.loopBlend ?? true);
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
