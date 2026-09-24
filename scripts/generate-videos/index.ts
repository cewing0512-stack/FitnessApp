/**
 * Demo video pipeline.
 *
 *   npm run videos:prompts                 Write prompts.md (all prompts, for manual use)
 *   npm run videos:status                  Which clips exist / are missing
 *   npm run videos:character               Generate 4 candidate character photos to pick from
 *   npm run videos:character -- --pick 2   Use candidate #2 as the reference image
 *   npm run videos:frames -- --only a,b    Only make the start-frame stills, to check them first
 *   npm run videos -- --only goblet-squat  Generate one clip (good first test)
 *   npm run videos                         Generate every missing exercise clip
 *   npm run videos:import                  Compress clips you made by hand (from ./inbox)
 *
 * Common flags for `videos`: --dry-run, --include-moves, --force, --new-frame, --no-start-frame,
 * --use-reference, --limit N,
 * --only a,b,c, --duration 8, --concurrency 2, --webm, --no-loop, --yes
 */
import dotenv from 'dotenv';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { compressClip } from './compress';
import { DEFAULTS, NEGATIVE_PROMPT, PATHS } from './config';
import { allClipSpecs, characterImagePrompt, renderPromptsMarkdown, type ClipSpec } from './prompts';
import { getProvider } from './providers';
import type { Image } from './providers/types';

const { positionals, values: args } = parseArgs({
  allowPositionals: true,
  options: {
    only: { type: 'string' },
    'include-moves': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
    'use-reference': { type: 'boolean', default: false },
    'no-start-frame': { type: 'boolean', default: false },
    'new-frame': { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    limit: { type: 'string' },
    duration: { type: 'string' },
    concurrency: { type: 'string' },
    webm: { type: 'boolean', default: false },
    'no-loop': { type: 'boolean', default: false },
    yes: { type: 'boolean', short: 'y', default: false },
    pick: { type: 'string' },
    count: { type: 'string' },
  },
});

dotenv.config({ quiet: true });
const env = process.env;
const command = positionals[0] ?? 'generate';
const exists = (p: string) => fs.existsSync(p);
const outFile = (id: string, ext: string) => path.join(PATHS.output, `${id}.${ext}`);
const fmtMB = (b: number) => `${(b / 1024 / 1024).toFixed(2)} MB`;
const characterPath = env.CHARACTER_IMAGE || DEFAULTS.characterImage;
const OPTIONS_DIR = 'scripts/generate-videos/character-options';
const frameFile = (id: string) => path.join(PATHS.startFrames, `${id}.jpg`);

/** Reads an image, sniffing the type: image models may return JPEG even when the file is named .png. */
async function readImage(p: string): Promise<Image> {
  const bytes = await fsp.readFile(p);
  return { bytes, mimeType: bytes[0] === 0xff && bytes[1] === 0xd8 ? 'image/jpeg' : 'image/png' };
}

async function main() {
  switch (command) {
    case 'prompts':
      return writePrompts();
    case 'status':
      return status();
    case 'character':
      return character();
    case 'import':
      return importInbox();
    case 'generate':
      return generate();
    case 'frames':
      return frames();
    default:
      throw new Error(`Unknown command "${command}". Use: generate | frames | prompts | status | character | import`);
  }
}

async function writePrompts() {
  await fsp.writeFile(PATHS.promptsMd, renderPromptsMarkdown());
  console.log(`Wrote ${PATHS.promptsMd} (${allClipSpecs({ includeMoves: true }).length} prompts).`);
}

function status() {
  const specs = allClipSpecs({ includeMoves: true });
  const has = (s: ClipSpec) => exists(outFile(s.id, 'mp4')) || exists(outFile(s.id, 'webm'));
  for (const kind of ['exercise', 'warmup', 'cooldown'] as const) {
    const list = specs.filter((s) => s.kind === kind);
    const done = list.filter(has);
    console.log(`\n${kind === 'exercise' ? 'Exercises' : kind === 'warmup' ? 'Warm-up moves' : 'Cool-down stretches'}: ${done.length}/${list.length}`);
    for (const s of list) console.log(`  ${has(s) ? '✓' : '·'} ${s.id}`);
  }
  console.log(`\nCharacter reference image: ${exists(characterPath) ? characterPath : 'none yet (run npm run videos:character)'}`);
}

async function character() {
  if (args.pick) {
    const src = path.join(OPTIONS_DIR, `character-${args.pick}.png`);
    if (!exists(src)) throw new Error(`${src} not found. Run npm run videos:character first.`);
    await fsp.copyFile(src, characterPath);
    console.log(`Using ${src} as the character reference → ${characterPath}`);
    return;
  }
  const provider = getProvider(env);
  if (!provider.generateImages) throw new Error(`Provider ${provider.name} cannot generate images. Add character.png by hand.`);
  const count = Number(args.count ?? 4);
  console.log(`Generating ${count} character photos…`);
  const images = await provider.generateImages(characterImagePrompt(), count);
  await fsp.mkdir(OPTIONS_DIR, { recursive: true });
  for (const [i, img] of images.entries()) {
    await fsp.writeFile(path.join(OPTIONS_DIR, `character-${i + 1}.png`), img.bytes);
  }
  console.log(`Saved ${images.length} options in ${OPTIONS_DIR}/. Pick one with: npm run videos:character -- --pick <n>`);
}

async function importInbox() {
  const known = new Set(allClipSpecs({ includeMoves: true }).map((s) => s.id));
  await fsp.mkdir(PATHS.inbox, { recursive: true });
  const files = (await fsp.readdir(PATHS.inbox)).filter((f) => /\.(mp4|mov|webm|m4v)$/i.test(f));
  if (!files.length) {
    console.log(`No clips in ${PATHS.inbox}/. Name them {exerciseId}.mp4 (see prompts.md).`);
    return;
  }
  await fsp.mkdir(PATHS.raw, { recursive: true });
  for (const f of files) {
    const id = path.parse(f).name;
    if (!known.has(id)) {
      console.warn(`  ✗ ${f}: "${id}" is not an exercise or move id. Check the "Save as" name in prompts.md.`);
      continue;
    }
    const src = path.join(PATHS.inbox, f);
    const r = await compressClip(src, PATHS.output, id, { webm: args.webm, loopBlend: !args['no-loop'] });
    await fsp.rename(src, path.join(PATHS.raw, f));
    console.log(`  ✓ ${id}: ${fmtMB(r.mp4Bytes)} (+ thumbnail)`);
  }
}

function selectSpecs(): ClipSpec[] {
  const only = args.only?.split(',').map((s) => s.trim()).filter(Boolean);
  const specs = allClipSpecs({ includeMoves: args['include-moves'] || !!only });
  if (!only) return specs;
  const unknown = only.filter((id) => !specs.some((s) => s.id === id));
  if (unknown.length) throw new Error(`Unknown id(s): ${unknown.join(', ')}. See npm run videos:status.`);
  return specs.filter((s) => only.includes(s.id));
}

/** Makes the start-frame still for one clip from character.png, unless it already exists. */
async function ensureStartFrame(spec: ClipSpec, character: Image, redo: boolean): Promise<Image> {
  const file = frameFile(spec.id);
  if (redo || !exists(file)) {
    const provider = getProvider(env);
    if (!provider.generateImages) throw new Error(`Provider ${provider.name} cannot generate images.`);
    const [img] = await provider.generateImages(spec.startFramePrompt, 1, character);
    if (!img) throw new Error('The image model returned no start frame. Try again.');
    await fsp.mkdir(PATHS.startFrames, { recursive: true });
    await fsp.writeFile(file, img.bytes);
  }
  return readImage(file);
}

async function frames() {
  if (!exists(characterPath)) throw new Error(`${characterPath} not found. Run npm run videos:character first.`);
  const character = await readImage(characterPath);
  const specs = selectSpecs();
  console.log(`Making ${specs.length} start frames (~$${(specs.length * DEFAULTS.pricePerImage).toFixed(2)})…`);
  await Promise.all(
    specs.map(async (s) => {
      try {
        await ensureStartFrame(s, character, args.force);
        console.log(`  [${s.id}] ✓ ${frameFile(s.id)}`);
      } catch (e) {
        console.log(`  [${s.id}] ✗ ${e instanceof Error ? e.message : e}`);
        process.exitCode = 1;
      }
    }),
  );
}

async function generate() {
  const duration = Number(args.duration ?? env.VIDEO_DURATION_SEC ?? DEFAULTS.durationSec);
  const concurrency = Math.max(1, Number(args.concurrency ?? DEFAULTS.concurrency));
  const pricePerSec = Number(env.VIDEO_PRICE_PER_SEC ?? DEFAULTS.pricePerSec);

  let specs = selectSpecs();
  const skipped = specs.filter((s) => !args.force && exists(outFile(s.id, 'mp4')));
  specs = specs.filter((s) => !skipped.includes(s));
  if (args.limit) specs = specs.slice(0, Number(args.limit));

  const provider = getProvider(env);
  const hasCharacter = exists(characterPath);
  // How the same woman is kept in every clip:
  //  - start frame (default): character.png is turned into a still of her starting pose, which Veo animates.
  //  - reference (--use-reference): character.png is sent as a style reference. Keeps her face, but the
  //    standing photo anchors her pose, so the reps become tiny.
  //  - text: description only. Good movement, but a different-looking woman in every clip.
  const useRef = hasCharacter && (args['use-reference'] || env.USE_CHARACTER_REFERENCE === 'true');
  const useStartFrame = hasCharacter && !useRef && !args['no-start-frame'] && !!provider.generateImages;
  const mode = useStartFrame ? `start frame from ${characterPath}` : useRef ? `reference image ${characterPath}` : 'text description only';
  const newFrames = useStartFrame ? specs.filter((s) => args['new-frame'] || !exists(frameFile(s.id))).length : 0;
  const cost = specs.length * duration * pricePerSec + newFrames * DEFAULTS.pricePerImage;
  console.log(`Provider: ${provider.name} (${env.VEO_MODEL || DEFAULTS.veoModel})`);
  console.log(`Character: ${mode}`);
  console.log(`Clips to generate: ${specs.length}${skipped.length ? ` (${skipped.length} already exist, use --force to redo)` : ''}`);
  console.log(`Length: ${duration}s each, vertical 9:16`);
  console.log(
    `Estimated cost: ~$${cost.toFixed(2)} (${specs.length} × ${duration}s × $${pricePerSec}/s` +
      `${newFrames ? ` + ${newFrames} start frames × $${DEFAULTS.pricePerImage}` : ''}, approximate; check Google's pricing page)`,
  );
  if (!specs.length) return;

  if (args['dry-run']) {
    for (const s of specs) console.log(`\n── ${s.id} ──\n${s.prompt}`);
    console.log(`\nNegative prompt: ${NEGATIVE_PROMPT}\n\nDry run: nothing was generated.`);
    return;
  }
  if (!hasCharacter) console.warn('\n⚠ No character.png. The person will look different in each clip. Run npm run videos:character first.');
  if (!args.yes) {
    if (!process.stdin.isTTY) throw new Error('Add --yes to confirm spending (non-interactive shell).');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question('\nGenerate now? This will be billed to your API account. [y/N] ');
    rl.close();
    if (!/^y(es)?$/i.test(answer.trim())) return console.log('Cancelled.');
  }

  const character = hasCharacter ? await readImage(characterPath) : undefined;
  const referenceImage = useRef && provider.supportsReferenceImage ? character : undefined;
  await fsp.mkdir(PATHS.raw, { recursive: true });

  const failures: { id: string; error: string }[] = [];
  let next = 0;
  // A quota or billing error means every later request will fail too, so stop starting new clips.
  let quotaHit = false;
  const worker = async () => {
    while (next < specs.length && !quotaHit) {
      const s = specs[next++]!;
      const log = (msg: string) => console.log(`  [${s.id}] ${msg}`);
      const raw = path.join(PATHS.raw, `${s.id}.mp4`);
      try {
        if (args.force || !exists(raw)) {
          const startFrame = useStartFrame ? await ensureStartFrame(s, character!, args['new-frame']) : undefined;
          log('generating…');
          await provider.generate({
            id: s.id,
            prompt: s.prompt,
            negativePrompt: NEGATIVE_PROMPT,
            aspectRatio: '9:16',
            durationSec: duration,
            ...(referenceImage ? { referenceImage } : {}),
            ...(startFrame ? { startFrame } : {}),
            outPath: raw,
            log,
          });
        } else {
          log('reusing earlier download');
        }
        const r = await compressClip(raw, PATHS.output, s.id, { webm: args.webm, loopBlend: !args['no-loop'] });
        log(`✓ done: ${fmtMB(r.mp4Bytes)}`);
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        failures.push({ id: s.id, error });
        log(`✗ ${error}`);
        if (/RESOURCE_EXHAUSTED|"code":(429|402)/.test(error)) quotaHit = true;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, specs.length) }, worker));

  const notStarted = specs.length - next;
  console.log(`\nFinished: ${next - failures.length}/${specs.length} clips.`);
  if (quotaHit) {
    console.log(
      `Stopped: the API quota or prepaid credit is used up (${notStarted} clips not started). ` +
        'Check billing and limits in AI Studio (https://ai.dev/rate-limit), then re-run the same command to continue.',
    );
  }
  if (failures.length) {
    console.log('Failed (re-run the same command to retry just these):');
    for (const f of failures) console.log(`  ${f.id}: ${f.error}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(`\nError: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
