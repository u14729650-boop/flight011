import { useTheme } from '../../context/ThemeContext';
import { MoonIcon, SunIcon } from './Icons';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={dark}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      <span className="theme-toggle__track">
        <SunIcon className="theme-toggle__sun" />
        <MoonIcon className="theme-toggle__moon" />
        <span className="theme-toggle__thumb" />
      </span>
    </button>
  );
}
