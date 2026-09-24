// Core data model for the workout library.
// Exercises and workouts are plain TypeScript data so they are easy to edit by hand.

export type Category = 'arms' | 'legs' | 'upper' | 'lower' | 'booty' | 'abs' | 'full';

export type WorkoutFormat = 'circuit' | 'straight';

export type Intensity = 'standard' | 'heavy';

/** What you hold for an exercise. */
export type Equipment = 'two-dumbbells' | 'one-dumbbell' | 'bodyweight';

/** Weight range in pounds, inclusive, e.g. [15, 25]. */
export type WeightRange = readonly [number, number];

export interface Exercise {
  id: string;
  name: string;
  targetMuscles: string[];
  equipment: Equipment;
  /**
   * Suggested range when the exercise is done "Strength / Heavy".
   * Omit for bodyweight moves. Standard workouts use your default
   * dumbbell weight from Settings (10 lb out of the box).
   */
  heavyWeightLb?: WeightRange;
  /** 2–4 short form cues. */
  cues: string[];
  /** Common mistakes to avoid. */
  mistakes: string[];
  /** An easier version of the movement. */
  modification: string;
  /** One side at a time: the 60s block is split, switching sides halfway. */
  perSide?: boolean;
  /**
   * Plain-language description of one rep, start to finish. The video
   * prompt generator uses this, so describe the motion precisely.
   */
  motion: string;
  /** Path to the looping demo clip, `/videos/{id}.mp4`. */
  video: string;
}

/** Bodyweight warm-up and cool-down moves. These are timed at 30s each, with no rest between them. */
export interface Move {
  id: string;
  name: string;
  kind: 'warmup' | 'cooldown';
  cues: string[];
  perSide?: boolean;
  motion: string;
  video: string;
}

export type WarmupPreset = 'full' | 'upper' | 'lower';
export type CooldownPreset = 'full' | 'upper' | 'lower' | 'core';

export interface WorkoutItem {
  exerciseId: string;
  /** Give each side its own full work block (used in straight-through workouts). */
  side?: 'left' | 'right';
  /** Mark a single exercise "Strength / Heavy" inside a standard workout. */
  heavy?: boolean;
  /** Override the suggested weight for this workout only. */
  weightLb?: number | WeightRange;
  /** Override the rep guidance, e.g. "6–8 slow reps". */
  reps?: string;
}

export interface Workout {
  id: string;
  name: string;
  category: Category;
  format: WorkoutFormat;
  intensity: Intensity;
  /** One short sentence shown on the detail screen. */
  description: string;
  /** How many times the item list repeats: 2–3 for circuits, 1 for straight-through workouts. */
  rounds: number;
  items: WorkoutItem[];
  warmup: WarmupPreset;
  cooldown: CooldownPreset;
}

export interface TimingSettings {
  workSec: number;
  restSec: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  arms: 'Arms',
  legs: 'Legs',
  upper: 'Upper Body',
  lower: 'Lower Body',
  booty: 'Booty',
  abs: 'Abs',
  full: 'Full Body',
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
