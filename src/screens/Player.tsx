import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { ProgressRing } from '../components/ProgressRing';
import {
  ChevronDownIcon,
  FlameIcon,
  MuteIcon,
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  VolumeIcon,
  XIcon,
} from '../components/icons';
import { addHistory } from '../db/db';
import { getWorkout } from '../data/library';
import type { Workout } from '../data/types';
import { describeSegment } from '../engine/describe';
import type { Segment, SegmentKind } from '../engine/timeline';
import * as T from '../engine/timerMachine';
import { stopSpeech, unlockAudio } from '../player/audio';
import { usePlayer } from '../player/usePlayer';
import { useWakeLock } from '../player/useWakeLock';
import { useApp } from '../state/store';

export interface CompletionState {
  workoutId: string;
  durationSec: number;
  completed: number;
  total: number;
  endedEarly: boolean;
}

const PHASE: Record<SegmentKind, { color: string; label: string }> = {
  work: { color: '#34d399', label: 'Work' },
  rest: { color: '#60a5fa', label: 'Rest' },
  warmup: { color: '#fbbf24', label: 'Warm-up' },
  cooldown: { color: '#c4b5fd', label: 'Stretch' },
};

export function Player() {
  const { id = '' } = useParams();
  const workout = getWorkout(id);
  if (!workout) return <Navigate to="/" replace />;
  return <PlayerView workout={workout} />;
}

function PlayerView({ workout }: { workout: Workout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, muted, setMuted } = useApp();
  const { state, now, segments, opts, actions } = usePlayer(workout, settings, {
    sound: settings.soundOn && !muted,
    voice: settings.voiceOn && !muted,
  });
  const [showCues, setShowCues] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  useWakeLock(state.status === 'running' || state.status === 'paused');

  // Coming from the Start button, audio is already unlocked, so begin right away.
  const autostarted = useRef(false);
  useEffect(() => {
    if (autostarted.current) return;
    autostarted.current = true;
    if ((location.state as { autostart?: boolean } | null)?.autostart) actions.start();
  }, [actions, location.state]);

  // Save history and show the completion screen once the timer finishes or is ended.
  const saved = useRef(false);
  useEffect(() => {
    if (state.status !== 'done' || saved.current) return;
    saved.current = true;
    const result: CompletionState = {
      workoutId: workout.id,
      durationSec: Math.round(state.activeMs / 1000),
      completed: state.completedWork.length,
      total: T.workTotal(state),
      endedEarly: state.completedWork.length < T.workTotal(state),
    };
    if (result.completed === 0) {
      navigate(`/workout/${workout.id}`, { replace: true });
      return;
    }
    void addHistory({
      workoutId: workout.id,
      workoutName: workout.name,
      category: workout.category,
      completedAt: new Date().toISOString(),
      durationSec: result.durationSec,
      exercisesCompleted: result.completed,
      exercisesTotal: result.total,
    }).catch((e) => console.warn('Could not save history', e));
    navigate(`/workout/${workout.id}/done`, { replace: true, state: result });
  }, [state, workout, navigate]);

  const seg = T.currentSegment(state) ?? segments[segments.length - 1]!;
  const info = describeSegment(seg, workout, opts);
  const phase = PHASE[seg.kind];
  const phaseLabel = seg.kind === 'rest' && seg.getReady ? 'Get ready' : phase.label;
  const secs = T.displaySeconds(state, now);
  const progress = T.segmentProgress(state, now);
  const totalMs = segments.reduce((a, s) => a + s.durationSec * 1000, 0);
  const overall = 1 - T.workoutRemainingMs(state, now) / totalMs;
  const paused = state.status === 'paused';
  const ready = state.status === 'ready';
  const isRest = seg.kind === 'rest';

  const toggleMute = () => {
    if (!muted) stopSpeech();
    else unlockAudio();
    setMuted(!muted);
  };

  const onRingTap = () => {
    if (ready) {
      unlockAudio();
      actions.start();
    } else {
      actions.togglePause();
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white select-none">
      {/* Demo media (during rest it shows the NEXT exercise). */}
      <ExerciseMedia id={info.id} cues={info.cues} color={phase.color} />
      {isRest && <div className="absolute inset-0 bg-[#0b1a33]/45" />}
      {paused && <div className="absolute inset-0 bg-black/45" />}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black via-black/85 to-transparent" />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-10 pt-[env(safe-area-inset-top)]">
        <div className="mx-3 mt-2 h-1 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-white/80" style={{ width: `${Math.max(0, overall) * 100}%` }} />
        </div>
        <div className="mx-auto flex max-w-xl items-center justify-between px-2 pt-1">
          <button
            type="button"
            onClick={() => (ready ? navigate(-1) : setConfirmEnd(true))}
            className="grid size-12 place-items-center rounded-full text-white/85 active:bg-white/10"
            aria-label="End workout"
          >
            <XIcon className="size-7" />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: phase.color }}>
              {phaseLabel}
            </p>
            <p className="text-sm font-medium text-white/70">{positionLabel(seg, segments, workout)}</p>
          </div>
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={muted}
            className="grid size-12 place-items-center rounded-full text-white/85 active:bg-white/10"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MuteIcon className="size-6" /> : <VolumeIcon className="size-6" />}
          </button>
        </div>
      </div>

      {/* Bottom panel */}
      <div className="absolute inset-x-0 bottom-0 z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xl px-5">
          {showCues && !ready && (
            <div className="animate-pop mb-3 rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur-md">
              <ul className="space-y-2 text-lg leading-snug">
                {info.cues.map((c) => (
                  <li key={c} className="flex gap-2.5">
                    <span className="mt-2.5 size-2 shrink-0 rounded-full" style={{ background: phase.color }} />
                    {c}
                  </li>
                ))}
              </ul>
              {info.modification && <p className="mt-3 text-[15px] text-white/60">Easier: {info.modification}</p>}
            </div>
          )}

          {isRest && (
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-rest">
              {seg.getReady ? 'First up' : 'Next up'}
            </p>
          )}
          <h1 className="text-[34px] font-bold leading-[1.1] tracking-tight [text-wrap:balance]">
            {info.name}
            {info.side && <span className="text-white/60"> · {info.side === 'left' ? 'Left' : 'Right'}</span>}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg">
            {info.weight && <WeightTag weight={info.weight} rest={isRest} />}
            {info.guidance && <span className="text-white/65">{info.guidance}</span>}
            {!info.weight && info.switchSides && <span className="text-white/65">Switch sides halfway</span>}
          </div>

          <button
            type="button"
            onClick={() => setShowCues(!showCues)}
            aria-expanded={showCues}
            className="-ml-1 mt-2 inline-flex h-10 items-center gap-1 rounded-full px-1 text-[15px] font-medium text-white/60"
          >
            Form cues
            <ChevronDownIcon className={`size-4 transition-transform ${showCues ? 'rotate-180' : ''}`} />
          </button>

          <div className="mt-2 flex items-center justify-between">
            <RoundButton label="Back" onClick={actions.back} disabled={ready}>
              <SkipBackIcon className="size-7" />
            </RoundButton>

            <button
              type="button"
              onClick={onRingTap}
              aria-label={ready ? 'Start' : paused ? 'Resume' : 'Pause'}
              className="rounded-full active:scale-[0.97]"
            >
              <ProgressRing progress={ready ? 0 : progress} size={188} stroke={12} color={phase.color}>
                <div className="flex flex-col items-center">
                  {ready ? (
                    <>
                      <PlayIcon className="size-14" />
                      <span className="mt-1 text-sm font-semibold uppercase tracking-widest text-white/70">Start</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[64px] font-bold leading-none tabular-nums tracking-tight">{formatClock(secs)}</span>
                      <span className="mt-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-white/60">
                        {paused ? (
                          <>
                            <PlayIcon className="size-3.5" /> Paused
                          </>
                        ) : (
                          <>
                            <PauseIcon className="size-3.5" /> Pause
                          </>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </ProgressRing>
            </button>

            <RoundButton label="Skip" onClick={actions.skip} disabled={ready}>
              <SkipForwardIcon className="size-7" />
            </RoundButton>
          </div>

          <div className="flex h-11 items-center justify-center">
            {seg.kind === 'warmup' && !ready && (
              <button type="button" onClick={actions.skipWarmup} className="h-11 px-4 text-[15px] font-medium text-white/60">
                Skip warm-up
              </button>
            )}
            {paused && (
              <button
                type="button"
                onClick={() => setConfirmEnd(true)}
                className="h-11 px-4 text-[15px] font-semibold text-fav"
              >
                End workout
              </button>
            )}
          </div>
        </div>
      </div>

      {confirmEnd && (
        <ConfirmEnd
          completed={state.completedWork.length}
          total={T.workTotal(state)}
          onCancel={() => setConfirmEnd(false)}
          onEnd={() => {
            setConfirmEnd(false);
            actions.end();
          }}
        />
      )}
    </div>
  );
}

function WeightTag({ weight, rest }: { weight: NonNullable<ReturnType<typeof describeSegment>['weight']>; rest: boolean }) {
  const hold = weight.hold === 'pair' ? ' each' : weight.hold === 'single' ? ' · one dumbbell' : '';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${
        weight.heavy ? 'bg-heavy/20 text-heavy' : 'bg-white/12 text-white'
      }`}
    >
      {weight.heavy && <FlameIcon className="size-4" />}
      {rest && weight.lb !== null ? 'Grab ' : ''}
      {weight.label}
      {weight.lb !== null && <span className="font-normal opacity-70">{hold}</span>}
    </span>
  );
}

function RoundButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-16 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition active:scale-90 active:bg-white/20 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function ConfirmEnd({
  completed,
  total,
  onCancel,
  onEnd,
}: {
  completed: number;
  total: number;
  onCancel: () => void;
  onEnd: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-black/60 backdrop-blur-sm sm:items-center" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal
        aria-labelledby="end-title"
        onClick={(e) => e.stopPropagation()}
        className="animate-pop mx-auto w-full max-w-md rounded-t-3xl border border-line bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
      >
        <h2 id="end-title" className="text-2xl font-bold">
          End workout?
        </h2>
        <p className="mt-2 text-[17px] text-white/65">
          {completed > 0
            ? `You've done ${completed} of ${total} exercises. This will be saved to your history.`
            : 'No exercises finished yet, so nothing will be saved.'}
        </p>
        <div className="mt-6 grid gap-3">
          <button type="button" onClick={onCancel} className="h-14 rounded-2xl bg-white text-lg font-semibold text-ink">
            Keep going
          </button>
          <button type="button" onClick={onEnd} className="h-14 rounded-2xl bg-white/10 text-lg font-semibold text-fav">
            End workout
          </button>
        </div>
      </div>
    </div>
  );
}

function formatClock(secs: number): string {
  if (secs < 60) return String(secs);
  const m = Math.floor(secs / 60);
  return `${m}:${String(secs % 60).padStart(2, '0')}`;
}

/** "Round 2 of 3 · 4 of 5", "Exercise 7 of 16", "Warm-up 2 of 6". */
function positionLabel(seg: Segment, segments: readonly Segment[], workout: Workout): string {
  if (seg.kind === 'warmup' || seg.kind === 'cooldown') {
    const group = segments.filter((s) => s.kind === seg.kind);
    const n = group.indexOf(seg) + 1;
    return `${n} of ${group.length}`;
  }
  const n = (seg.itemIndex ?? 0) + 1;
  const of = workout.items.length;
  return workout.format === 'circuit' ? `Round ${seg.round} of ${workout.rounds} · ${n} of ${of}` : `Exercise ${n} of ${of}`;
}
