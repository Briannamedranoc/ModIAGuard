import { Menu, Search, X } from 'lucide-react';
import type { NavItem } from '../config/navigation';
import { NotificationsMenu } from './NotificationsMenu';
import { ThemeToggle } from './ThemeToggle';

type TopNavbarProps = {
  current: NavItem | undefined;
  onMenuToggle: () => void;
  sidebarOpen: boolean;
};

export function TopNavbar({ current, onMenuToggle, sidebarOpen }: TopNavbarProps) {
  const CurrentIcon = current?.icon;

  return (
    <header className="theme-navbar sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-elevated)] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)] lg:hidden"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          {CurrentIcon ? (
            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-500 dark:text-violet-300 sm:flex">
              <CurrentIcon className="h-4 w-4" strokeWidth={1.75} />
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wider text-[var(--app-text-subtle)]">
              Moderation workspace
            </p>
            <h1 className="truncate text-base font-semibold text-[var(--app-text)] sm:text-lg">
              {current?.label ?? 'Dashboard'}
            </h1>
          </div>
        </div>

        <div className="hidden max-w-md flex-1 md:flex">
          <label className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-subtle)]" />
            <input
              type="search"
              readOnly
              placeholder="Search tools, reports, logs…"
              className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-elevated)] py-2.5 pl-10 pr-4 text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-subtle)] focus:border-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </label>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <NotificationsMenu />
        </div>
      </div>
    </header>
  );
}
