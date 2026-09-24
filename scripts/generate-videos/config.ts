/**
 * Shared look for every demo clip. Changing anything here changes every
 * prompt, so regenerate prompts.md (`npm run videos:prompts`) afterwards.
 */

/** The one consistent person who appears in every clip. */
export const CHARACTER =
  'the same athletic woman in her early 30s in every clip: toned, healthy build, ' +
  'dark brown hair pulled back in a high ponytail, light natural makeup, ' +
  'wearing a fitted sage-green tank top, black high-waisted full-length leggings and clean white training sneakers';

/** The one consistent setting. */
export const SETTING =
  'a minimal, bright photo studio with a seamless light-gray backdrop and a matching light-gray floor, ' +
  'soft even lighting with gentle shadows, nothing else in the room';

export const STYLE =
  'Photorealistic, natural body proportions, realistic hands firmly gripping the equipment, sharp focus, ' +
  'smooth natural motion, no music, no text, no captions, no logos, no on-screen graphics.';

export const NEGATIVE_PROMPT =
  'text, captions, subtitles, watermark, logo, multiple people, extra limbs, extra fingers, distorted hands, ' +
  'deformed dumbbells, mirror reflections, camera movement, zoom, cuts, scene change, cropped head, cropped feet, ' +
  'blurry, low quality, cartoon, gym crowd, bad form, rounded back';

/** Defaults, overridable in .env (see .env.example). */
export const DEFAULTS = {
  provider: 'veo',
  veoModel: 'veo-3.1-fast-generate-preview',
  imageModel: 'gemini-3.1-flash-image',
  durationSec: 8,
  /** Approximate USD per second of generated video, only used for the cost estimate. */
  pricePerSec: 0.15,
  /** Approximate USD per start-frame image, only used for the cost estimate. */
  pricePerImage: 0.04,
  concurrency: 2,
  characterImage: 'scripts/generate-videos/character.png',
};

export const PATHS = {
  /** Final, compressed files the app serves. */
  output: 'public/videos',
  /** Untouched downloads from the provider (git-ignored). */
  raw: 'scripts/generate-videos/.raw',
  /** First-frame stills of the character in each starting position (git-ignored, cheap to remake). */
  startFrames: 'scripts/generate-videos/start-frames',
  /** Drop manually made clips here as {id}.mp4, then run `npm run videos:import`. */
  inbox: 'scripts/generate-videos/inbox',
  promptsMd: 'prompts.md',
};
