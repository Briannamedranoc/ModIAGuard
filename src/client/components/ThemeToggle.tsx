import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl border transition',
        'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]',
        'hover:border-violet-500/40 hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]',
        showLabel ? 'px-3 py-2 text-sm font-medium' : 'h-10 w-10',
        className,
      ].join(' ')}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
    >
      {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      {showLabel ? <span>{isDark ? 'Tema claro' : 'Tema oscuro'}</span> : null}
    </button>
  );
}
