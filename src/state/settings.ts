import { DEFAULT_DUMBBELL_LB } from '../data/weights';

export interface Settings {
  workSec: number;
  restSec: number;
  /** 3-2-1 beeps. */
  soundOn: boolean;
  /** Spoken cues ("Next up: goblet squats"). */
  voiceOn: boolean;
  /** Weight shown for standard (non-heavy) blocks. */
  defaultLb: number;
}

export const DEFAULT_SETTINGS: Settings = {
  workSec: 60,
  restSec: 30,
  soundOn: true,
  voiceOn: true,
  defaultLb: DEFAULT_DUMBBELL_LB,
};

/** Merge stored settings over defaults, ignoring anything malformed. */
export function normalizeSettings(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return s;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? Math.round(v) : undefined;
  s.workSec = num(r.workSec, 10, 300) ?? s.workSec;
  s.restSec = num(r.restSec, 0, 300) ?? s.restSec;
  s.defaultLb = num(r.defaultLb, 1, 100) ?? s.defaultLb;
  if (typeof r.soundOn === 'boolean') s.soundOn = r.soundOn;
  if (typeof r.voiceOn === 'boolean') s.voiceOn = r.voiceOn;
  return s;
}
