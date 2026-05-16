import { NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { BRAND_NAME, NAV_ITEMS, PANEL_TITLE } from '../config/navigation';
type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="theme-sidebar flex h-full w-72 flex-col border-r">
      <div className="border-b border-[var(--app-border)] px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-900/40">
            <Shield className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--app-text)]">{BRAND_NAME}</p>
            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-violet-500 dark:text-violet-300/90">
              Moderation AI
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[var(--app-text-subtle)]">{PANEL_TITLE}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'border-l-2 border-violet-500 bg-violet-500/15 text-violet-600 shadow-inner shadow-violet-500/5 ring-1 ring-violet-500/25 dark:text-violet-200'
                    : 'theme-nav-link-inactive border-l-2 border-transparent text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                      isActive
                        ? 'border-violet-500/30 bg-violet-500/20 text-violet-600 dark:text-violet-300'
                        : 'border-[var(--app-border)] bg-[var(--app-surface-elevated)] text-[var(--app-text-subtle)] group-hover:text-[var(--app-text-muted)]',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-[var(--app-border)] p-4">
        <p className="rounded-lg bg-[var(--app-surface-elevated)] px-3 py-2 text-center text-[11px] text-[var(--app-text-subtle)]">
          Hackathon build · UI preview
        </p>
      </div>
    </aside>
  );
}
