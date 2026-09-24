import { mediaFor } from '../data/media';
import { DumbbellIcon } from './icons';

interface Props {
  id: string;
  name: string;
  className?: string;
}

/**
 * Square preview for an exercise. Shows the generated thumbnail when one exists
 * in public/videos, otherwise a calm placeholder tile tinted with the current `--accent`.
 */
export function ExerciseThumb({ id, name, className = 'size-16' }: Props) {
  const { thumb } = mediaFor(id);
  if (thumb) {
    return (
      <img
        src={thumb}
        alt=""
        loading="lazy"
        className={`${className} shrink-0 rounded-xl bg-surface-2 object-cover object-top`}
      />
    );
  }
  const words = name.replace(/\(.*\)/, '').split(/\s+/).filter((w) => /^[A-Z]/.test(w));
  const initials = words.length > 1 ? `${words[0]![0]}${words.at(-1)![0]}` : (words[0]?.slice(0, 2) ?? '');
  return (
    <div
      aria-hidden
      className={`${className} relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2`}
      style={{ backgroundImage: 'radial-gradient(120% 90% at 20% 0%, color-mix(in oklab, var(--accent) 28%, transparent), transparent 70%)' }}
    >
      <DumbbellIcon className="absolute size-10 text-(--accent) opacity-15" />
      <span className="relative text-sm font-semibold tracking-wide text-white/80">{initials}</span>
    </div>
  );
}
