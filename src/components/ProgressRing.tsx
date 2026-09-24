import type { ReactNode } from 'react';

interface Props {
  /** 0 → 1 */
  progress: number;
  size: number;
  stroke?: number;
  color: string;
  children?: ReactNode;
}

/** Circular progress ring. Fills clockwise from 12 o'clock. */
export function ProgressRing({ progress, size, stroke = 10, color, children }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="rgb(0 0 0 / 0.35)" stroke="rgb(255 255 255 / 0.14)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          style={{ transition: 'stroke-dashoffset 120ms linear, stroke 300ms' }}
        />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
