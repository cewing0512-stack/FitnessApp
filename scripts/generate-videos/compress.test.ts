import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import ffmpegStatic from 'ffmpeg-static';
import { describe, expect, it } from 'vitest';
import { LOOP_FADE_SEC, compressClip, probeDuration, videoFilter } from './compress';

const run = promisify(execFile);

describe('videoFilter', () => {
  it('cross-fades the end into the start for long enough clips', () => {
    const f = videoFilter(8, true);
    expect(f).toContain(`trim=start=${LOOP_FADE_SEC}`);
    expect(f).toContain(`xfade=transition=fade:duration=${LOOP_FADE_SEC}:offset=${(8 - 2 * LOOP_FADE_SEC).toFixed(3)}`);
  });

  it('only scales when blending is off or the clip is too short', () => {
    expect(videoFilter(8, false)).not.toContain('xfade');
    expect(videoFilter(8, false)).not.toContain('trim');
    expect(videoFilter(1.5, true)).not.toContain('xfade');
  });

  it('cuts at the chosen loop point', () => {
    expect(videoFilter(6.2, true)).toContain('trim=end=6.200');
  });
});

describe('compressClip (real ffmpeg)', () => {
  it('writes a 720×1280 looped MP4 without audio, plus a thumbnail', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clip-'));
    const input = path.join(dir, 'raw.mp4');
    // 4s landscape test pattern with a tone, to check scaling/cropping and audio removal.
    await run(ffmpegStatic!, [
      '-y', '-loglevel', 'error',
      '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=24:duration=4',
      '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4',
      '-shortest', '-c:v', 'libx264', '-c:a', 'aac', input,
    ]);

    const r = await compressClip(input, dir, 'test-clip');
    expect(fs.existsSync(path.join(dir, 'test-clip.jpg'))).toBe(true);
    const out = await probeDuration(r.mp4);
    expect(out).toBeGreaterThan(1.5);
    expect(out).toBeLessThanOrEqual(4 - LOOP_FADE_SEC + 0.05);

    const { stderr } = await run(ffmpegStatic!, ['-hide_banner', '-i', r.mp4]).catch((e) => e);
    expect(stderr).toMatch(/720x1280/);
    expect(stderr).not.toMatch(/Audio:/);
    expect(r.mp4Bytes).toBeLessThan(1.5 * 1024 * 1024);
  }, 60_000);
});
