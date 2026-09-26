# Dumbbell Library

A personal dumbbell workout **library** PWA. You browse and pick a workout yourself. The app never schedules anything.

> Status: all 5 phases are built: the library, the workout player, history, settings, an installable offline PWA, and the AI demo-video pipeline.

## Develop

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests, including library validation
npm run build      # typecheck + production build
```

## Library data

Everything lives in `src/data/` as plain TypeScript.

| File | What it holds |
| --- | --- |
| `exercises.ts` | The master list of 40 dumbbell/bodyweight exercises (cues, mistakes, modification, motion description, video path) |
| `moves.ts` | Bodyweight warm-up and stretch moves, plus the warm-up/cool-down presets |
| `workouts/*.ts` | One file per category. Workouts only reference exercises by id |
| `weights.ts` | Works out the suggested weight and rep guidance for each block |
| `validate.ts` | Checks the whole library; runs as part of `npm test` |

### Add an exercise
1. Copy an entry in `src/data/exercises.ts` and give it a new kebab-case `id`.
2. Fill in every field. `motion` should precisely describe one rep, because it becomes the video prompt.
3. Dumbbell exercises need a `heavyWeightLb` range. Bodyweight ones don't.
4. Run `npm test`. Validation fails if a field is missing or the exercise isn't used in any workout.

### Add a workout
Add an object to the category file in `src/data/workouts/`:

```ts
{
  id: 'my-new-workout',
  name: 'My New Workout',
  category: 'arms',            // arms | legs | upper | lower | booty | abs | full
  format: 'circuit',           // circuit (2–3 rounds) | straight (1 round, no repeats)
  intensity: 'standard',       // standard (your default weight) | heavy
  description: 'One short sentence.',
  rounds: 3,
  items: items('bicep-curl', { exerciseId: 'goblet-squat', heavy: true }, 'push-up'),
  warmup: 'upper',             // full | upper | lower
  cooldown: 'upper',           // full | upper | lower | core
}
```

Durations are never typed in. They're computed as warm-up (3 min) + get-ready + work/rest blocks + cool-down (2.5 min). At the default 60s work / 30s rest, **15–16 work blocks ≈ 28–30 min**, so use 5 × 3, 8 × 2, or 16 straight. Validation warns if a workout falls outside 27–32 min.

For one-sided moves in a straight-through workout, use `...bothSides('split-squat')` to give each side a full 60s block. Otherwise the block is split 30s per side.

## Demo videos

Each exercise gets a short, silent, looping 9:16 clip of the same AI-generated woman (sage-green tank top, black leggings, white sneakers, light-gray studio), stored as `public/videos/{id}.mp4` plus a `{id}.jpg` thumbnail. The app detects files automatically (via `vite/media-index.ts`). Until a clip exists it shows an animated placeholder, so the app works without any videos.

### Generate with Google Veo

Setup, one time:

```bash
cp .env.example .env        # then paste your key into GEMINI_API_KEY
```

Get a key at [Google AI Studio](https://aistudio.google.com/apikey). Veo is a paid model, so billing must be enabled on the key's Google Cloud project.

Commands:

```bash
npm run videos:character                  # 4 candidate photos of the character → pick one:
npm run videos:character -- --pick 2      # saves it as scripts/generate-videos/character.png
npm run videos:frames -- --only hammer-curl   # start-pose image(s) only (a few cents): check the pose first
npm run videos -- --only hammer-curl      # ONE clip (~$1.20). Always review before keeping
npm run videos                            # every missing exercise clip (asks before spending)
npm run videos:status                     # what's done / missing
```

**How clips are made (start-frame mode, the default):** the image model first redraws the character photo in the exercise's starting position, then Veo animates from that frame. Earlier approaches, like sending the standing photo as a reference, kept pulling every movement back toward standing upright.

**What we learned testing Veo 3.1 (Sept 2026):**
- **Review every clip.** Only about 1 in 3 had form good enough to keep. Standing dumbbell moves (rows, curls) work best. Deep squats, lunges and floor exercises (bridges, crunches) usually come out wrong, so those keep the animated placeholder for now.
- **Standard Veo 3.1 wasn't better** than Fast for form, so use Fast.
- **Never let the prompt imply speech.** Veo invents a soundtrack, and if the character "talks" its audio safety filter refuses the clip (not charged). The prompts say she never talks.
- **New API accounts have a small daily Veo quota** (a handful of clips per day). Rejected requests aren't charged. Re-run the same command the next day; finished clips are skipped.

- **Consistency:** every prompt shares the same character, outfit, studio and camera rules (`scripts/generate-videos/config.ts`), plus that exercise's motion description and form cues. When `character.png` exists, it's also sent to Veo as a reference image.
- **Cost:** the script prints an estimate and asks for confirmation before generating. It uses about $0.15 per second on Veo 3.1 Fast (≈ $1.20 per 8s clip, ≈ $48 for all 40 exercises). Pricing changes, so check Google's pricing page. Set `VEO_MODEL=veo-3.1-generate-preview` for higher quality at a higher price.
- **Retries:** existing clips are skipped, so if some fail, re-run the same command. Use `--force` to redo a clip you don't like.
- **Output:** each clip is cropped to 720×1280, audio is removed, and it's compressed to H.264 with fast-start (usually well under 1 MB). The end cross-fades into the start so the loop has no visible jump (`--no-loop` to disable), and a thumbnail is taken from the first frame. Add `--webm` to also write a VP9 WebM.
- **Other services:** providers are swappable. Implement `VideoProvider` (`scripts/generate-videos/providers/types.ts`) for Runway, Kling, Luma, etc., and register it in `providers/index.ts`. `VIDEO_PROVIDER=mock` renders free test patterns to try the pipeline. Delete those files afterwards.

### Make clips by hand

[`prompts.md`](prompts.md) lists every prompt (regenerate it with `npm run videos:prompts` after editing exercises). Paste a prompt into any web tool, then:

1. Save the clip as the exact name shown (e.g. `goblet-squat.mp4`) in `scripts/generate-videos/inbox/`.
2. Run `npm run videos:import`. It crops, compresses, loop-blends and thumbnails the clip into `public/videos/`.

Commit `public/videos/` and push. Vercel redeploys, and the app caches each clip for offline use after its first play.

## The player

The timer is a pure state machine in `src/engine/timerMachine.ts`, fully unit tested. It stores the wall-clock time each segment ends rather than counting ticks, so it never drifts. If the phone throttles or suspends the page, it catches up exactly when you come back.

- **Controls:** tap the ring to pause or resume. Back restarts the current block if you're more than 3s in, otherwise it goes to the previous one. Skip moves to the next block. During the warm-up there's a "Skip warm-up" button. ✕ ends the workout, after a confirmation.
- **Completed exercises:** a block counts as done if you did at least half of it. Workouts with at least one completed block are saved to History.
- **Audio:** 3-2-1 beeps plus spoken cues ("Rest. Next up: Goblet Squat, 20 to 30 pounds.", "Switch sides.") via Web Audio and the Web Speech API. Toggle them in Settings, or tap the speaker in the player to mute.
- **Music:** demo videos are always muted and the audio session is set to *ambient*, so your music or podcast keeps playing. On iPhone the silent switch also silences the cues.
- **Screen stays on** during a workout via the Screen Wake Lock API. If you lock the phone anyway, the timer catches up when you unlock. Cues don't play while the screen is locked, because iOS suspends web pages.
- **Settings are captured at the start:** changing work/rest time mid-workout applies to the next workout.

## Offline and installable (PWA)

- The app shell and all thumbnails are **precached on the first visit**, so the library, detail screens, player, history and settings all work in airplane mode.
- Demo clips are **cached automatically the first time they play**. To grab them all at once, before a trip or a basement gym, use **Settings → Offline → Save all**.
- When you deploy a new version, the app shows **"A new version is available"** with an Update button. It never reloads on its own and never shows up mid-workout.
- Your data (favorites, history, settings) lives in IndexedDB on the device. It isn't synced anywhere. Deleting the home-screen app or clearing Safari website data erases it.

## Deploy to Vercel (free)

1. Push this repo to GitHub (it already is, if you're reading this there).
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, and click **Add New… → Project**.
3. Pick this repository. Vercel detects **Vite** automatically, so keep the defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Click **Deploy**. In about a minute you'll get a URL like `https://dumbbell-library.vercel.app`.
5. From then on, every push to the production branch redeploys automatically. Other branches get their own preview URLs.

`vercel.json` already handles routing for direct links like `/workout/heavy-arms`, and makes sure the service worker is never cached stale.

> Want to use Netlify instead? Build command `npm run build`, publish directory `dist`, and add a `public/_redirects` file containing `/* /index.html 200`.

## Add it to your home screen

**iPhone (Safari)**
1. Open your Vercel URL in **Safari**. Other iOS browsers can't install web apps on older iOS versions.
2. Tap the **Share** button (square with an arrow), scroll down, and tap **Add to Home Screen**.
3. Keep the name "Dumbbells" and tap **Add**.
4. Open it from the home screen. It runs full screen, without Safari's toolbars.
5. Open a workout once while online so its videos are cached, or use **Settings → Save all**.

**Android (Chrome)**
1. Open the URL in **Chrome**.
2. Tap **⋮ → Add to Home screen** (or **Install app**). Chrome may also show an install banner.
3. Confirm **Install**.

Tip: on iPhone, cues follow the ring/silent switch. Keep ringer on to hear beeps and voice over your music.
