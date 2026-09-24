import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Workout } from '../data/types';
import { DONE_CUE, HALFWAY_CUE, segmentCue } from '../engine/cues';
import { describeSegment } from '../engine/describe';
import { buildTimeline } from '../engine/timeline';
import * as T from '../engine/timerMachine';
import type { Settings } from '../state/settings';
import { beep, speak, stopSpeech } from './audio';

const TICK_MS = 100;

interface AudioPrefs {
  sound: boolean;
  voice: boolean;
}

/**
 * Runs a workout: owns the timer state, ticks it, and turns timer events into
 * beeps and spoken cues. The timeline is built once from the settings at the
 * moment the player opens, so changing settings mid-workout has no effect.
 */
export function usePlayer(workout: Workout, settings: Settings, audio: AudioPrefs) {
  const [snapshot] = useState(() => settings);
  const segments = useMemo(
    () => buildTimeline(workout, { workSec: snapshot.workSec, restSec: snapshot.restSec }),
    [workout, snapshot],
  );
  const opts = useMemo(() => ({ defaultLb: snapshot.defaultLb, workSec: snapshot.workSec }), [snapshot]);

  const [state, setState] = useState(() => T.createTimer(segments));
  const [now, setNow] = useState(() => Date.now());
  const stateRef = useRef(state);
  const audioRef = useRef(audio);
  audioRef.current = audio;

  const handleEvents = useCallback(
    (events: T.TimerEvent[], s: T.TimerState, fromUser: boolean) => {
      const { sound, voice } = audioRef.current;
      for (const e of events) {
        if (e.type === 'segment') {
          if (sound && !fromUser) beep(e.segment.kind === 'work' ? 'work' : 'rest');
          if (voice) {
            const text = segmentCue(s.segments, e.index, workout, opts);
            if (text) speak(text);
          } else if (fromUser) stopSpeech();
        } else if (e.type === 'countdown') {
          if (sound) beep('count');
        } else if (e.type === 'halfway') {
          const seg = s.segments[e.index];
          // Rests describe the upcoming exercise, so only real blocks can switch sides.
          if (seg && seg.kind !== 'rest' && describeSegment(seg, workout, opts).switchSides) {
            if (sound) beep('switch');
            if (voice) speak(HALFWAY_CUE);
          }
        } else if (e.type === 'done') {
          if (sound) beep('done');
          if (voice) speak(DONE_CUE);
        }
      }
    },
    [workout, opts],
  );

  const commit = useCallback((next: T.TimerState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  /** Apply a user action that may emit events. */
  const act = useCallback(
    (fn: (s: T.TimerState, now: number) => T.TickResult) => {
      const t = Date.now();
      const r = fn(stateRef.current, t);
      if (r.state === stateRef.current) return;
      commit(r.state);
      setNow(t);
      handleEvents(r.events, r.state, fn !== T.start);
    },
    [commit, handleEvents],
  );

  const doTick = useCallback(() => {
    const t = Date.now();
    const r = T.tick(stateRef.current, t);
    if (r.state !== stateRef.current) commit(r.state);
    setNow(t);
    if (r.events.length) handleEvents(r.events, r.state, false);
  }, [commit, handleEvents]);

  const running = state.status === 'running';
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(doTick, TICK_MS);
    // Catch up immediately when returning from the background / screen lock.
    const onVisible = () => document.visibilityState === 'visible' && doTick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [running, doTick]);

  useEffect(() => () => stopSpeech(), []);

  const actions = useMemo(
    () => ({
      start: () => act(T.start),
      togglePause: () => {
        const t = Date.now();
        commit(T.togglePause(stateRef.current, t));
        setNow(t);
        stopSpeech();
      },
      skip: () => act(T.skip),
      back: () => act(T.back),
      skipWarmup: () => act(T.skipWarmup),
      end: () => {
        const t = Date.now();
        const next = T.end(stateRef.current, t);
        commit(next);
        stopSpeech();
        return next;
      },
    }),
    [act, commit],
  );

  return { state, now, segments, opts, actions };
}
