/**
 * Demo video pipeline.
 *
 *   npm run videos:prompts                 Write prompts.md (all prompts, for manual use)
 *   npm run videos:status                  Which clips exist / are missing
 *   npm run videos:character               Generate 4 candidate character photos to pick from
 *   npm run videos:character -- --pick 2   Use candidate #2 as the reference image
 *   npm run videos -- --only goblet-squat  Generate one clip (good first test)
 *   npm run videos                         Generate every missing exercise clip
 *   npm run videos:import                  Compress clips you made by hand (from ./inbox)
 *
 * Common flags for `videos`: --dry-run, --include-moves, --force, --use-reference, --limit N,
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

const { positionals, values: args } = parseArgs({
  allowPositionals: true,
  options: {
    only: { type: 'string' },
    'include-moves': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
    'use-reference': { type: 'boolean', default: false },
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
    default:
      throw new Error(`Unknown command "${command}". Use: generate | prompts | status | character | import`);
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

async function generate() {
  const only = args.only?.split(',').map((s) => s.trim()).filter(Boolean);
  const duration = Number(args.duration ?? env.VIDEO_DURATION_SEC ?? DEFAULTS.durationSec);
  const concurrency = Math.max(1, Number(args.concurrency ?? DEFAULTS.concurrency));
  const pricePerSec = Number(env.VIDEO_PRICE_PER_SEC ?? DEFAULTS.pricePerSec);

  let specs = allClipSpecs({ includeMoves: args['include-moves'] || !!only });
  if (only) {
    const unknown = only.filter((id) => !specs.some((s) => s.id === id));
    if (unknown.length) throw new Error(`Unknown id(s): ${unknown.join(', ')}. See npm run videos:status.`);
    specs = specs.filter((s) => only.includes(s.id));
  }
  const skipped = specs.filter((s) => !args.force && exists(outFile(s.id, 'mp4')));
  specs = specs.filter((s) => !skipped.includes(s));
  if (args.limit) specs = specs.slice(0, Number(args.limit));

  // Off by default: with Veo, the standing reference photo anchors her pose and the reps become tiny.
  const useRef = args['use-reference'] || env.USE_CHARACTER_REFERENCE === 'true';
  const hasRef = useRef && exists(characterPath);
  console.log(`Provider: ${env.VIDEO_PROVIDER || DEFAULTS.provider} (${env.VEO_MODEL || DEFAULTS.veoModel})`);
  console.log(`Character reference: ${hasRef ? characterPath : 'off (text description only; --use-reference to send character.png)'}`);
  console.log(`Clips to generate: ${specs.length}${skipped.length ? ` (${skipped.length} already exist, use --force to redo)` : ''}`);
  console.log(`Length: ${duration}s each, vertical 9:16`);
  console.log(
    `Estimated cost: ~$${(specs.length * duration * pricePerSec).toFixed(2)} ` +
      `(${specs.length} × ${duration}s × $${pricePerSec}/s, approximate; check Google's pricing page)`,
  );
  if (!specs.length) return;

  if (args['dry-run']) {
    for (const s of specs) console.log(`\n── ${s.id} ──\n${s.prompt}`);
    console.log(`\nNegative prompt: ${NEGATIVE_PROMPT}\n\nDry run: nothing was generated.`);
    return;
  }
  if (useRef && !hasRef) console.warn('\n⚠ No character.png. The person may look different in each clip. Run npm run videos:character first.');
  if (!args.yes) {
    if (!process.stdin.isTTY) throw new Error('Add --yes to confirm spending (non-interactive shell).');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question('\nGenerate now? This will be billed to your API account. [y/N] ');
    rl.close();
    if (!/^y(es)?$/i.test(answer.trim())) return console.log('Cancelled.');
  }

  const provider = getProvider(env);
  const refBytes = hasRef && provider.supportsReferenceImage ? await fsp.readFile(characterPath) : undefined;
  // Sniff the type: image models may return JPEG even though the file is named .png.
  const referenceImage = refBytes
    ? { bytes: refBytes, mimeType: refBytes[0] === 0xff && refBytes[1] === 0xd8 ? 'image/jpeg' : 'image/png' }
    : undefined;
  await fsp.mkdir(PATHS.raw, { recursive: true });

  const failures: { id: string; error: string }[] = [];
  let next = 0;
  // A quota error means every later request will fail too, so stop starting new clips.
  let quotaHit = false;
  const worker = async () => {
    while (next < specs.length && !quotaHit) {
      const s = specs[next++]!;
      const log = (msg: string) => console.log(`  [${s.id}] ${msg}`);
      const raw = path.join(PATHS.raw, `${s.id}.mp4`);
      try {
        if (args.force || !exists(raw)) {
          log('generating…');
          await provider.generate({
            id: s.id,
            prompt: s.prompt,
            negativePrompt: NEGATIVE_PROMPT,
            aspectRatio: '9:16',
            durationSec: duration,
            ...(referenceImage ? { referenceImage } : {}),
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
        if (/RESOURCE_EXHAUSTED|"code":429/.test(error)) quotaHit = true;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, specs.length) }, worker));

  const notStarted = specs.length - next;
  console.log(`\nFinished: ${next - failures.length}/${specs.length} clips.`);
  if (quotaHit) {
    console.log(
      `Stopped: the API quota is used up (${notStarted} clips not started). ` +
        'Check https://ai.dev/rate-limit, then re-run the same command later to continue.',
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
