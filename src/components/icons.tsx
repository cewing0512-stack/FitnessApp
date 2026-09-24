import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (p: P): P => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  ...p,
});

export const HeartIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.3 4.5 6.9 4.5c2 0 3.4 1.1 5.1 3 1.7-1.9 3.1-3 5.1-3 3.6 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
  </svg>
);
export const ClockIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const DumbbellIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
  </svg>
);
export const RepeatIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M17 2l3 3-3 3" />
    <path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3" />
    <path d="M20 13v2a4 4 0 0 1-4 4H4" />
  </svg>
);
export const ListIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
  </svg>
);
export const FlameIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 22c4 0 7-2.7 7-6.8 0-3.2-2-5.8-4.3-8.2-.5 2-1.6 3.3-3 3.8.4-3-.8-6.3-3.7-8.8C8 6 5 9.4 5 15.2 5 19.3 8 22 12 22z" />
  </svg>
);
export const ChevronLeftIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
export const ChevronDownIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const PlayIcon = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" />
  </svg>
);
export const GridIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </svg>
);
export const HistoryIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7v5l3 2" />
  </svg>
);
export const SlidersIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);
