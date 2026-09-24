import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpegStatic from 'ffmpeg-static';
import type { VideoProvider } from './types';

const run = promisify(execFile);

/**
 * Free, offline stand-in for a real service: renders a labelled test pattern.
 * Use it to try the whole pipeline without an API key (VIDEO_PROVIDER=mock).
 * Delete the resulting files from public/videos before deploying.
 */
export function createMockProvider(): VideoProvider {
  return {
    name: 'mock',
    supportsReferenceImage: false,
    async generate(req) {
      await run(process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg', [
        '-y', '-loglevel', 'error',
        '-f', 'lavfi', '-i', `testsrc2=size=720x1280:rate=24:duration=${req.durationSec}`,
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', req.outPath,
      ]);
      req.log('mock clip rendered');
    },
  };
}
