import type { CooldownPreset, Move, WarmupPreset } from './types';

/**
 * Bodyweight warm-up and cool-down moves. These are separate from the dumbbell
 * exercise list. Each one runs for MOVE_SEC seconds with no rest in between.
 */
export const MOVE_SEC = 30;

type MoveInput = Omit<Move, 'video'>;
const mv = (m: MoveInput): Move => ({ ...m, video: `/videos/${m.id}.mp4` });

export const MOVES: Move[] = [
  // ─── Warm-up ─────────────────────────────────────────────────────────
  mv({
    id: 'march-in-place',
    name: 'March in Place',
    kind: 'warmup',
    cues: ['Lift knees to a comfortable height', 'Swing your arms naturally'],
    motion: 'She marches in place at an easy pace, lifting her knees and swinging her arms naturally.',
  }),
  mv({
    id: 'step-jack',
    name: 'Step Jacks',
    kind: 'warmup',
    cues: ['Step one foot out as arms rise overhead', 'Alternate sides, low impact'],
    motion:
      'She steps her right foot out to the side while raising both arms overhead, steps back in while lowering them, then repeats to the left, alternating in a low-impact jumping jack.',
  }),
  mv({
    id: 'arm-circles',
    name: 'Arm Circles',
    kind: 'warmup',
    cues: ['Arms out at shoulder height', 'Small circles growing bigger, then reverse'],
    motion:
      'Standing tall with arms extended out to the sides at shoulder height, she makes forward circles that grow gradually larger, then reverses direction.',
  }),
  mv({
    id: 'shoulder-rolls',
    name: 'Shoulder Rolls',
    kind: 'warmup',
    cues: ['Roll shoulders up, back and down', 'Slow and smooth'],
    motion: 'Standing tall with arms relaxed, she rolls both shoulders up toward her ears, back, and down in slow circles.',
  }),
  mv({
    id: 'torso-twist',
    name: 'Torso Twists',
    kind: 'warmup',
    cues: ['Feet planted, hips mostly still', 'Rotate your upper body side to side'],
    motion:
      'Standing with feet shoulder-width and elbows bent at chest height, she rotates her upper body gently to the right and then to the left in a steady rhythm.',
  }),
  mv({
    id: 'bodyweight-squat',
    name: 'Bodyweight Squats',
    kind: 'warmup',
    cues: ['Sit back, chest tall', 'Easy depth to start, go deeper each rep'],
    motion:
      'Standing with feet shoulder-width, arms reaching forward for balance, she squats down at an easy pace with chest tall and stands back up.',
  }),
  mv({
    id: 'hip-hinge',
    name: 'Hip Hinges',
    kind: 'warmup',
    cues: ['Hands on hips, soft knees', 'Push hips back with a flat back, then stand'],
    motion:
      'Standing with hands on her hips and soft knees, she pushes her hips back and tips her flat torso forward to about 45 degrees, then squeezes her glutes to stand tall.',
  }),
  mv({
    id: 'hip-circles',
    name: 'Hip Circles',
    kind: 'warmup',
    cues: ['Hands on hips', 'Draw big slow circles, then reverse'],
    motion: 'Standing with feet hip-width and hands on her hips, she draws large slow circles with her hips, then reverses.',
  }),
  mv({
    id: 'lunge-reach',
    name: 'Reverse Lunge with Reach',
    kind: 'warmup',
    cues: ['Step back into a gentle lunge', 'Reach both arms overhead, alternate legs'],
    motion:
      'She steps her right foot back into a gentle reverse lunge while reaching both arms overhead, returns to standing, then repeats on the left, alternating.',
  }),

  // ─── Cool-down ───────────────────────────────────────────────────────
  mv({
    id: 'forward-fold',
    name: 'Standing Forward Fold',
    kind: 'cooldown',
    cues: ['Soft knees, let your head hang', 'Breathe slowly into the hamstrings'],
    motion:
      'Standing with feet hip-width and soft knees, she folds forward from the hips and lets her upper body and arms hang relaxed toward the floor, breathing slowly.',
  }),
  mv({
    id: 'quad-stretch',
    name: 'Standing Quad Stretch',
    kind: 'cooldown',
    perSide: true,
    cues: ['Hold your ankle behind you', 'Knees together, hips pressed forward'],
    motion:
      'Standing on her left leg, she bends her right knee and holds her right ankle behind her with her right hand, knees together and hips pressed slightly forward, holding the stretch.',
  }),
  mv({
    id: 'hip-flexor-stretch',
    name: 'Kneeling Hip Flexor Stretch',
    kind: 'cooldown',
    perSide: true,
    cues: ['Back knee down, tuck your pelvis', 'Shift forward gently, torso tall'],
    motion:
      'In a half-kneeling position on a mat with her right knee down and left foot forward, she tucks her pelvis and gently shifts her hips forward with a tall torso, holding the stretch.',
  }),
  mv({
    id: 'figure-four',
    name: 'Figure-Four Stretch',
    kind: 'cooldown',
    perSide: true,
    cues: ['Lying down, ankle crossed over the opposite knee', 'Pull the bottom thigh toward you'],
    motion:
      'Lying on her back, she crosses her right ankle over her left knee and draws her left thigh toward her chest with both hands, holding the glute stretch.',
  }),
  mv({
    id: 'chest-opener',
    name: 'Chest Opener',
    kind: 'cooldown',
    cues: ['Clasp hands behind your back', 'Lift your chest, draw shoulders back'],
    motion:
      'Standing tall, she clasps her hands behind her back, straightens her arms, lifts her chest and draws her shoulders back and down, holding the stretch.',
  }),
  mv({
    id: 'cross-body-shoulder',
    name: 'Cross-Body Shoulder Stretch',
    kind: 'cooldown',
    perSide: true,
    cues: ['Bring one arm across your chest', 'Hug it in with the other arm, shoulders down'],
    motion:
      'Standing tall, she brings her straight right arm across her chest and gently hugs it in with her left forearm, shoulders relaxed, holding the stretch.',
  }),
  mv({
    id: 'triceps-stretch',
    name: 'Overhead Triceps Stretch',
    kind: 'cooldown',
    perSide: true,
    cues: ['Reach one hand down your upper back', 'Gently press the elbow with the other hand'],
    motion:
      'Standing tall, she raises her right arm, bends the elbow to reach her hand down between her shoulder blades, and gently presses the elbow with her left hand, holding the stretch.',
  }),
  mv({
    id: 'cat-cow',
    name: 'Cat-Cow',
    kind: 'cooldown',
    cues: ['On hands and knees', 'Round your spine up, then let it dip, with your breath'],
    motion:
      'On hands and knees on a mat, she slowly rounds her spine up toward the ceiling tucking her chin, then lets her belly drop and lifts her chest and gaze, flowing with her breath.',
  }),
  mv({
    id: 'cobra',
    name: 'Cobra Stretch',
    kind: 'cooldown',
    cues: ['Lie face down, hands under your shoulders', 'Gently lift your chest, hips stay down'],
    motion:
      'Lying face down on a mat with hands under her shoulders, she gently presses up to lift her chest while keeping her hips on the floor and shoulders relaxed, holding the stretch.',
  }),
  mv({
    id: 'childs-pose',
    name: 'Child’s Pose',
    kind: 'cooldown',
    cues: ['Sit your hips back to your heels', 'Reach your arms forward and breathe'],
    motion:
      'Kneeling on a mat, she sits her hips back toward her heels and folds forward, arms extended in front and forehead resting down, breathing slowly.',
  }),
];

export const MOVE_BY_ID: Record<string, Move> = Object.fromEntries(MOVES.map((m) => [m.id, m]));

export function getMove(id: string): Move {
  const m = MOVE_BY_ID[id];
  if (!m) throw new Error(`Unknown move id: ${id}`);
  return m;
}

/** Each warm-up is 6 × 30s = 3 min. */
export const WARMUPS: Record<WarmupPreset, string[]> = {
  full: ['march-in-place', 'arm-circles', 'torso-twist', 'bodyweight-squat', 'hip-hinge', 'step-jack'],
  upper: ['march-in-place', 'shoulder-rolls', 'arm-circles', 'torso-twist', 'hip-hinge', 'step-jack'],
  lower: ['march-in-place', 'hip-circles', 'bodyweight-squat', 'hip-hinge', 'lunge-reach', 'step-jack'],
};

/** Each cool-down is 5 × 30s = 2.5 min. */
export const COOLDOWNS: Record<CooldownPreset, string[]> = {
  full: ['forward-fold', 'quad-stretch', 'chest-opener', 'figure-four', 'childs-pose'],
  upper: ['chest-opener', 'cross-body-shoulder', 'triceps-stretch', 'cat-cow', 'childs-pose'],
  lower: ['forward-fold', 'quad-stretch', 'hip-flexor-stretch', 'figure-four', 'childs-pose'],
  core: ['cobra', 'cat-cow', 'hip-flexor-stretch', 'figure-four', 'childs-pose'],
};
