import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import {
  CalendarIcon,
  InsightsIcon,
  JournalIcon,
  LockIcon,
  PolaroidIcon,
  SettingsIcon,
} from './Icons';

const NAV_ITEMS = [
  { to: '/', label: 'Journal', Icon: JournalIcon, end: true },
  { to: '/calendar', label: 'Calendar', Icon: CalendarIcon, end: false },
  { to: '/wall', label: 'Polaroid Wall', Icon: PolaroidIcon, end: false },
  { to: '/insights', label: 'Insights', Icon: InsightsIcon, end: false },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon, end: false },
];

export function Sidebar() {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[var(--border)] px-5 py-7 lg:flex">
      <div className="px-1.5">
        <Logo />
      </div>

      <nav className="mt-11 flex flex-col gap-1.5" aria-label="Main">
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="nav-pill">
            <Icon className="h-[19px] w-[19px] shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2 px-2 pt-8 text-[11px] text-[var(--muted)]">
        <LockIcon className="h-3.5 w-3.5" />
        <span>Private · offline · encrypted</span>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-[var(--border)] px-3 py-2 lg:hidden"
      aria-label="Main"
    >
      {NAV_ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="nav-pill shrink-0 !gap-2 !px-3 !py-2 !text-[12.5px]"
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
