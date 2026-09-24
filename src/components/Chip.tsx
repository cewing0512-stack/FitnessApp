import type { ReactNode } from 'react';

interface Props {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: 'default' | 'heavy' | 'fav';
}

export function Chip({ selected, onClick, children, tone = 'default' }: Props) {
  const on =
    tone === 'heavy'
      ? 'border-heavy/60 bg-heavy/15 text-heavy'
      : tone === 'fav'
        ? 'border-fav/60 bg-fav/15 text-fav'
        : 'border-white/90 bg-white text-ink';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[15px] font-medium transition-colors active:scale-[0.97] ${
        selected ? on : 'border-line bg-surface text-white/75 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
