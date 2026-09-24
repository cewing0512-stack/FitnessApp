import { useEffect, useState } from 'react';
import { mediaFor } from '../data/media';
import { cacheVideo } from '../player/offline';

interface Props {
  id: string;
  cues: string[];
  /** Accent colour for the placeholder. */
  color: string;
}

/**
 * Full-bleed looping demo clip. Videos are always muted and inline, so they
 * never interrupt the user's music. Until a clip exists (or if it fails to
 * load) it shows an animated placeholder with the form cues.
 */
export function ExerciseMedia({ id, cues, color }: Props) {
  const media = mediaFor(id);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [id]);

  if ((media.mp4 || media.webm) && !failed) {
    return (
      <video
        key={id}
        className="absolute inset-0 size-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        poster={media.thumb}
        onError={() => setFailed(true)}
        onPlaying={(e) => void cacheVideo(e.currentTarget.currentSrc)}
      >
        {media.webm && <source src={media.webm} type="video/webm" />}
        {media.mp4 && <source src={media.mp4} type="video/mp4" onError={() => setFailed(true)} />}
      </video>
    );
  }
  return <Placeholder key={id} cues={cues} color={color} />;
}

function Placeholder({ cues, color }: { cues: string[]; color: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (cues.length < 2) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % cues.length), 3500);
    return () => window.clearInterval(t);
  }, [cues.length]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: `radial-gradient(120% 70% at 50% 25%, color-mix(in oklab, ${color} 35%, #0b0d10), #0b0d10 70%)` }}
    >
      {/* Sits in the space above the player's bottom panel. */}
      <div className="absolute inset-x-8 top-[max(6rem,calc(env(safe-area-inset-top)+5rem))] bottom-[27rem] flex flex-col items-center justify-center gap-5 overflow-hidden">
        <svg
          viewBox="0 0 100 160"
          className="animate-bob h-full max-h-56 min-h-0 shrink opacity-30"
          fill="none"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="50" cy="20" r="12" fill="white" stroke="none" />
          <path d="M50 38v50M50 88l-16 50M50 88l16 50M50 48l-26 22M50 48l26 22" />
          <path d="M14 66v12M34 70v4M20 72h10M86 66v12M66 70v4M70 72h10" strokeWidth="5" />
        </svg>
        <p key={i} className="animate-fade-cue shrink-0 text-center text-xl font-semibold leading-snug text-white/80">
          {cues[i]}
        </p>
      </div>
    </div>
  );
}
