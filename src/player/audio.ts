/**
 * Beeps (Web Audio) and spoken cues (Web Speech API).
 *
 * iOS only allows audio after a user gesture, so call `unlockAudio()` from a
 * tap handler (the Start button does this) before the timer begins.
 *
 * The page never plays media with sound (demo videos are muted), and the
 * audio session is set to "ambient" where supported, so music or podcasts
 * from another app keep playing underneath the cues.
 */

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

let ctx: AudioContext | null = null;
let voice: SpeechSynthesisVoice | null = null;

const hasSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice() {
  if (!hasSpeech()) return;
  const voices = speechSynthesis.getVoices();
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  const preferred = ['Samantha', 'Google US English', 'Karen', 'Moira', 'Daniel', 'Microsoft Aria', 'Microsoft Jenny'];
  voice =
    preferred.map((n) => en.find((v) => v.name.includes(n))).find(Boolean) ??
    en.find((v) => v.localService && v.lang === 'en-US') ??
    en[0] ??
    null;
}

if (hasSpeech()) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

/** Call inside a user gesture (tap) to allow sound on iOS/Safari. Safe to call repeatedly. */
export function unlockAudio() {
  try {
    const nav = navigator as AudioSessionNavigator;
    if (nav.audioSession) nav.audioSession.type = 'ambient';
  } catch {
    /* not supported */
  }
  const c = getCtx();
  if (c) {
    if (c.state === 'suspended') void c.resume();
    // A silent buffer fully unlocks older iOS versions.
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, 22050);
    src.connect(c.destination);
    src.start(0);
  }
  if (hasSpeech()) {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
}

function tone(freq: number, startAt: number, duration: number, volume = 0.35) {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const t = c.currentTime + startAt;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export type BeepKind = 'count' | 'work' | 'rest' | 'switch' | 'done';

export function beep(kind: BeepKind) {
  switch (kind) {
    case 'count':
      return tone(880, 0, 0.14);
    case 'work':
      return tone(1320, 0, 0.45, 0.4);
    case 'rest':
      return tone(660, 0, 0.35);
    case 'switch':
      tone(990, 0, 0.12);
      return tone(990, 0.18, 0.12);
    case 'done':
      tone(784, 0, 0.25);
      tone(988, 0.18, 0.25);
      return tone(1319, 0.36, 0.6);
  }
}

export function speak(text: string) {
  if (!hasSpeech() || !text) return;
  speechSynthesis.cancel(); // newest cue wins
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? 'en-US';
  u.rate = 1.02;
  u.volume = 1;
  speechSynthesis.speak(u);
}

export function stopSpeech() {
  if (hasSpeech()) speechSynthesis.cancel();
}

export const speechSupported = hasSpeech;
