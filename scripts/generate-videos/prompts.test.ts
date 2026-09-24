import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../../src/data/exercises';
import { MOVES } from '../../src/data/moves';
import { CHARACTER, SETTING } from './config';
import { allClipSpecs, buildPrompt, renderPromptsMarkdown } from './prompts';

describe('video prompts', () => {
  const specs = allClipSpecs({ includeMoves: true });

  it('covers every exercise and move exactly once', () => {
    expect(specs.map((s) => s.id).sort()).toEqual([...EXERCISES, ...MOVES].map((e) => e.id).sort());
    expect(allClipSpecs({ includeMoves: false })).toHaveLength(EXERCISES.length);
  });

  it('uses the same character, setting and format in every prompt', () => {
    for (const s of specs) {
      expect(s.prompt).toContain(CHARACTER);
      expect(s.prompt).toContain(SETTING);
      expect(s.prompt).toContain('Vertical 9:16');
      expect(s.prompt).toContain('loop seamlessly');
    }
  });

  it('includes the exercise-specific motion and form cues', () => {
    const goblet = EXERCISES.find((e) => e.id === 'goblet-squat')!;
    const p = specs.find((s) => s.id === 'goblet-squat')!.prompt;
    expect(p).toContain(goblet.motion);
    for (const cue of goblet.cues) expect(p).toContain(cue);
    expect(p).toContain('single black hexagonal rubber dumbbell');
  });

  it('frames floor exercises from the side with a mat', () => {
    const floor = specs.find((s) => s.id === 'floor-press')!.prompt;
    expect(floor).toContain('side view');
    expect(floor).toContain('exercise mat');
    const standing = specs.find((s) => s.id === 'bicep-curl')!.prompt;
    expect(standing).toContain('hip height');
    expect(standing).not.toContain('exercise mat');
  });

  it('describes holds and stretches as holds, not reps', () => {
    expect(buildPrompt({ motion: 'x', cues: ['a'], equipment: 'none', holdOrStretch: true })).toContain('holds it');
    expect(specs.find((s) => s.id === 'childs-pose')!.prompt).toContain('holds it');
    expect(specs.find((s) => s.id === 'push-up')!.prompt).toContain('She uses no equipment.');
  });

  it('asks for each clip\'s start frame in that exercise\'s starting position', () => {
    const goblet = EXERCISES.find((e) => e.id === 'goblet-squat')!;
    const frame = specs.find((s) => s.id === 'goblet-squat')!.startFramePrompt;
    expect(frame).toContain('STARTING POSITION');
    expect(frame).toContain(goblet.motion);
    expect(frame).toContain(SETTING);
    expect(specs.find((s) => s.id === 'floor-press')!.startFramePrompt).toContain('exercise mat');
  });

  it('prompts.md is up to date (run `npm run videos:prompts` if this fails)', () => {
    expect(fs.readFileSync('prompts.md', 'utf8')).toBe(renderPromptsMarkdown());
  });
});
