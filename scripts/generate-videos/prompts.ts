import { EXERCISES } from '../../src/data/exercises';
import { MOVES } from '../../src/data/moves';
import type { Equipment } from '../../src/data/types';
import { CHARACTER, NEGATIVE_PROMPT, SETTING, STYLE } from './config';

export interface ClipSpec {
  id: string;
  name: string;
  kind: 'exercise' | 'warmup' | 'cooldown';
  prompt: string;
  /** Image prompt for the first frame: her in the starting position, edited from character.png. */
  startFramePrompt: string;
}

const FLOOR_WORDS = /\b(lying|lies|on her back|face down|plank|seated|kneeling|half-kneeling|hands and knees|on a mat)\b/i;

function equipmentLine(equipment: Equipment | 'none'): string {
  switch (equipment) {
    case 'two-dumbbells':
      return 'She uses a pair of matching black hexagonal rubber dumbbells.';
    case 'one-dumbbell':
      return 'She uses a single black hexagonal rubber dumbbell.';
    default:
      return 'She uses no equipment.';
  }
}

/**
 * Builds the full text prompt for one clip: the shared character, setting and
 * camera rules, plus the exercise-specific motion and form cues.
 */
function framing(motion: string) {
  const floor = FLOOR_WORDS.test(motion);
  return {
    camera: floor
      ? 'Locked-off static camera, slightly elevated side view, framed so her entire body on the mat is visible with margin on all sides.'
      : 'Locked-off static camera at hip height, facing her at a slight three-quarter angle, her entire body visible from head to feet with space above her head and below her feet.',
    mat: floor ? ' A dark gray exercise mat lies on the floor.' : '',
  };
}

export function buildPrompt(input: {
  motion: string;
  cues: string[];
  equipment: Equipment | 'none';
  holdOrStretch?: boolean;
}): string {
  const { camera, mat } = framing(input.motion);
  const reps = input.holdOrStretch
    ? 'She moves into the position slowly and holds it with steady breathing, making small natural movements.'
    : 'She performs two slow, controlled repetitions through the FULL range of motion described above, ' +
      'with large, clearly visible movement: every repetition reaches the full end position before returning. ' +
      'She is actively exercising the whole time, never standing still or making small partial movements.';

  return [
    'Vertical 9:16 fitness demonstration video, one continuous shot.',
    camera,
    `The person is ${CHARACTER}.`,
    `Setting: ${SETTING}.${mat}`,
    equipmentLine(input.equipment),
    `Movement: ${input.motion}`,
    `${reps} The clip begins and ends in the same starting position so it can loop seamlessly.`,
    `Form: ${input.cues.join('; ')}.`,
    'If a reference photo is provided, use it only for her appearance and outfit, not for her pose.',
    STYLE,
  ].join('\n');
}

/**
 * Image prompt for a clip's first frame. It is sent together with character.png, so the
 * same woman appears in every clip while each clip starts from its own exercise pose.
 */
export function buildStartFramePrompt(input: { motion: string; equipment: Equipment | 'none' }): string {
  const { camera, mat } = framing(input.motion);
  return [
    'Using the woman in the attached photo (same face, hair, body and outfit), create a new vertical 9:16 photo',
    'of her frozen in the STARTING POSITION of this exercise, just before the first repetition begins:',
    `${input.motion}`,
    equipmentLine(input.equipment),
    `Camera: ${camera.replace('Locked-off static camera', 'camera')}`,
    `Setting: ${SETTING}.${mat}`,
    'Photorealistic, sharp focus, natural proportions, realistic hands gripping the equipment. No text, no logos.',
  ].join('\n');
}

const HOLD_IDS = new Set(['side-plank']);

export function allClipSpecs(opts: { includeMoves: boolean }): ClipSpec[] {
  const exercises: ClipSpec[] = EXERCISES.map((e) => ({
    id: e.id,
    name: e.name,
    kind: 'exercise',
    prompt: buildPrompt({ motion: e.motion, cues: e.cues, equipment: e.equipment, holdOrStretch: HOLD_IDS.has(e.id) }),
    startFramePrompt: buildStartFramePrompt({ motion: e.motion, equipment: e.equipment }),
  }));
  if (!opts.includeMoves) return exercises;
  const moves: ClipSpec[] = MOVES.map((m) => ({
    id: m.id,
    name: m.name,
    kind: m.kind,
    prompt: buildPrompt({ motion: m.motion, cues: m.cues, equipment: 'none', holdOrStretch: m.kind === 'cooldown' }),
    startFramePrompt: buildStartFramePrompt({ motion: m.motion, equipment: 'none' }),
  }));
  return [...exercises, ...moves];
}

/** The reference-image prompt: a neutral full-body photo of the character. */
export function characterImagePrompt(): string {
  return [
    `Full-body studio photograph, vertical 9:16, of ${CHARACTER}.`,
    'She stands facing the camera in a relaxed neutral stance, arms at her sides, friendly neutral expression.',
    `Setting: ${SETTING}.`,
    'Entire body visible from head to toe with space around her. Photorealistic, sharp focus, natural skin texture.',
  ].join(' ');
}

/** Contents of prompts.md: every prompt, for generating clips manually in a web tool. */
export function renderPromptsMarkdown(): string {
  const specs = allClipSpecs({ includeMoves: true });
  const section = (title: string, list: ClipSpec[]) =>
    [
      `## ${title}`,
      '',
      ...list.flatMap((s) => [`### ${s.name}`, '', `Save as: \`${s.id}.mp4\``, '', '```text', s.prompt, '```', '']),
    ].join('\n');

  return [
    '# Demo video prompts',
    '',
    '<!-- Generated by `npm run videos:prompts` from src/data and scripts/generate-videos/config.ts. Do not edit by hand. -->',
    '',
    'One prompt per clip. Every prompt describes the same character, outfit and studio so the clips match.',
    '',
    '**To make a clip by hand** (Google Flow / Gemini, Runway, Kling, Luma, …):',
    '',
    '1. Upload `scripts/generate-videos/character.png` as a character or reference image if the tool supports it.',
    '2. Set the format to **vertical 9:16**, about **8 seconds**, and turn sound off if possible.',
    '3. Paste the prompt. If the tool has a negative-prompt field, paste the one below.',
    '4. Download the clip, name it exactly as shown ("Save as"), and put it in `scripts/generate-videos/inbox/`.',
    '5. Run `npm run videos:import`. It compresses the clip, makes it loop smoothly, and creates the thumbnail.',
    '',
    '**Negative prompt** (for every clip):',
    '',
    '```text',
    NEGATIVE_PROMPT,
    '```',
    '',
    section('Exercises', specs.filter((s) => s.kind === 'exercise')),
    section('Warm-up moves (optional)', specs.filter((s) => s.kind === 'warmup')),
    section('Cool-down stretches (optional)', specs.filter((s) => s.kind === 'cooldown')),
  ].join('\n');
}
