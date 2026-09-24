import { NavLink } from 'react-router';
import { GridIcon, HistoryIcon, SlidersIcon } from './icons';

const TABS = [
  { to: '/', label: 'Library', Icon: GridIcon, end: true },
  { to: '/history', label: 'History', Icon: HistoryIcon, end: false },
  { to: '/settings', label: 'Settings', Icon: SlidersIcon, end: false },
];

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="mx-auto flex max-w-xl">
        {TABS.map(({ to, label, Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-white/45'
                }`
              }
            >
              <Icon className="size-6" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
