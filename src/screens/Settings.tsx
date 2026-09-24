import { useEffect, useState, type ReactNode } from 'react';
import { WORKOUTS } from '../data/library';
import { workoutDurationSec } from '../engine/timeline';
import { beep, speak, speechSupported, unlockAudio } from '../player/audio';
import { allClips, cacheAllClips, countCachedClips } from '../player/offline';
import { DEFAULT_SETTINGS } from '../state/settings';
import { useApp } from '../state/store';

const COMMON_WEIGHTS = [5, 8, 10, 12, 15, 20];

export function Settings() {
  const { settings, updateSettings } = useApp();
  const durations = WORKOUTS.map((w) => workoutDurationSec(w, settings) / 60);
  const lo = Math.round(Math.min(...durations));
  const hi = Math.round(Math.max(...durations));
  const isDefault = JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS);

  const testSound = () => {
    unlockAudio();
    if (settings.soundOn) beep('work');
    if (settings.voiceOn) speak('Next up: goblet squat, 10 pounds.');
  };

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="text-[34px] font-bold tracking-tight">Settings</h1>

      <Group title="Timing" footer={`Workouts currently run ${lo === hi ? `${lo}` : `${lo}–${hi}`} minutes.`}>
        <Row label="Work" hint="Each exercise">
          <Stepper
            value={settings.workSec}
            min={20}
            max={120}
            step={5}
            format={(v) => `${v}s`}
            onChange={(workSec) => updateSettings({ workSec })}
          />
        </Row>
        <Row label="Rest" hint="Between exercises">
          <Stepper
            value={settings.restSec}
            min={0}
            max={90}
            step={5}
            format={(v) => `${v}s`}
            onChange={(restSec) => updateSettings({ restSec })}
          />
        </Row>
      </Group>

      <Group title="Weights" footer="Used for standard workouts. Heavy workouts show their own suggested range.">
        <Row label="Dumbbells" hint="Your default weight">
          <Stepper
            value={settings.defaultLb}
            min={1}
            max={50}
            step={1}
            format={(v) => `${v} lb`}
            onChange={(defaultLb) => updateSettings({ defaultLb })}
          />
        </Row>
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {COMMON_WEIGHTS.map((lb) => (
            <button
              key={lb}
              type="button"
              onClick={() => updateSettings({ defaultLb: lb })}
              aria-pressed={settings.defaultLb === lb}
              className={`h-10 min-w-14 rounded-full border px-3 text-[15px] font-medium ${
                settings.defaultLb === lb ? 'border-white bg-white text-ink' : 'border-line text-white/70'
              }`}
            >
              {lb} lb
            </button>
          ))}
        </div>
      </Group>

      <Group
        title="Sound"
        footer={
          speechSupported()
            ? 'Cues play over your music. On iPhone, turn off silent mode to hear them.'
            : 'Voice cues are not supported in this browser.'
        }
      >
        <Row label="3-2-1 beeps">
          <Toggle checked={settings.soundOn} onChange={(soundOn) => updateSettings({ soundOn })} label="3-2-1 beeps" />
        </Row>
        <Row label="Voice cues" hint={'"Next up: goblet squat"'}>
          <Toggle checked={settings.voiceOn} onChange={(voiceOn) => updateSettings({ voiceOn })} label="Voice cues" />
        </Row>
        <div className="p-3">
          <button type="button" onClick={testSound} className="h-12 w-full rounded-xl bg-surface-2 font-medium active:bg-white/10">
            Test sound
          </button>
        </div>
      </Group>

      <OfflineVideos />

      <button
        type="button"
        disabled={isDefault}
        onClick={() => updateSettings(DEFAULT_SETTINGS)}
        className="mt-8 h-12 w-full rounded-2xl border border-line font-medium text-white/70 disabled:opacity-40"
      >
        Reset to defaults
      </button>
      <p className="mt-6 text-center text-sm text-white/35">
        Everything is stored on this device only. No account, no tracking.
      </p>
    </div>
  );
}

function OfflineVideos() {
  const total = allClips().length;
  const [cached, setCached] = useState<number | null>(null);
  const [progress, setProgress] = useState<[number, number] | null>(null);

  useEffect(() => {
    countCachedClips()
      .then(setCached)
      .catch(() => setCached(0));
  }, []);

  const saveAll = async () => {
    setProgress([0, total]);
    try {
      setCached(await cacheAllClips((d, t) => setProgress([d, t])));
    } finally {
      setProgress(null);
    }
  };

  const footer =
    total === 0
      ? 'No demo videos yet. Once clips are added to public/videos, you can save them here.'
      : 'Clips are also saved automatically the first time they play. The app itself always works offline.';

  return (
    <Group title="Offline" footer={footer}>
      <Row label="Demo videos" hint={total ? `${cached ?? '…'} of ${total} saved on this device` : 'None available yet'}>
        <button
          type="button"
          disabled={total === 0 || progress !== null || cached === total}
          onClick={() => void saveAll()}
          className="h-11 shrink-0 rounded-full bg-surface-2 px-4 font-medium active:bg-white/15 disabled:opacity-40"
        >
          {progress ? `${progress[0]}/${progress[1]}` : cached === total && total > 0 ? 'All saved' : 'Save all'}
        </button>
      </Row>
    </Group>
  );
}

function Group({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="px-1 text-sm font-medium uppercase tracking-widest text-white/40">{title}</h2>
      <div className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">{children}</div>
      {footer && <p className="mt-2 px-1 text-sm text-white/45">{footer}</p>}
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-2">
      <div>
        <p className="text-[17px]">{label}</p>
        {hint && <p className="text-sm text-white/45">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const btn =
    'grid size-11 place-items-center rounded-full bg-surface-2 text-2xl font-medium leading-none active:bg-white/15 disabled:opacity-30';
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} aria-label="Decrease">
        −
      </button>
      <span className="w-16 text-center text-lg font-semibold tabular-nums" aria-live="polite">
        {format(value)}
      </span>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} aria-label="Increase">
        +
      </button>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${checked ? 'bg-work' : 'bg-white/20'}`}
    >
      <span
        className={`absolute left-1 top-1 size-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}
