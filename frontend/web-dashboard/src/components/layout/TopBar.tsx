import { useLocation } from 'react-router-dom';
import { Search, Bell, Wifi, Menu, Sun, Moon } from 'lucide-react';
import { useDrillGuard } from '../../context/DrillGuardContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../common/Logo';

interface TopBarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
  /** When true, show logo + wordmark in top bar (e.g. when sidebar is hidden or collapsed). */
  showBranding?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Fleet Overview',
  '/alerts': 'Alert Management',
  '/history': 'Historical Analysis',
  '/settings': 'Settings',
};

export default function TopBar({ sidebarCollapsed, onMobileMenuToggle, showBranding = false }: TopBarProps) {
  const location = useLocation();
  const { alerts, user } = useDrillGuard();
  const { theme, toggleTheme } = useTheme();
  const unackedAlerts = alerts.filter(a => a.status === 'new').length;

  const pathLabel = ROUTE_LABELS[location.pathname] ||
    (location.pathname.startsWith('/wells/') ? 'Well Detail' : 'DrillGuard');

  const breadcrumbs = location.pathname.startsWith('/wells/')
    ? ['Fleet Overview', pathLabel]
    : [pathLabel];

  return (
    <header
      className={`
        fixed top-0 right-0 h-14 bg-dg-bg-card border-b border-dg-border z-topbar
        flex items-center px-4 gap-4 transition-all duration-200
        ${sidebarCollapsed ? 'left-16' : 'left-60'}
      `}
    >
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden text-dg-text-secondary hover:text-dg-text-primary"
      >
        <Menu size={20} />
      </button>

      {showBranding && (
        <div className="flex items-center gap-2 shrink-0">
          <Logo size={28} animated={false} />
          <span className="text-base font-semibold text-dg-text-primary hidden sm:inline">DrillGuard</span>
        </div>
      )}

      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-dg-text-tertiary">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'text-dg-text-primary font-medium' : 'text-dg-text-tertiary'}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="relative hidden sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dg-text-tertiary" />
        <input
          type="text"
          placeholder="Search wells, alerts..."
          className="w-64 h-8 bg-dg-bg-primary border border-dg-border rounded-lg pl-9 pr-3 text-sm text-dg-text-primary placeholder-dg-text-tertiary focus:border-dg-info focus:ring-1 focus:ring-dg-info/30 outline-none transition-all"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-dg-normal" />
        <Wifi size={14} className="text-dg-normal hidden sm:block" />
      </div>

      <button
        onClick={toggleTheme}
        className="p-2 text-dg-text-secondary hover:text-dg-text-primary transition-colors rounded-lg hover:bg-dg-bg-card-hover"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <button className="relative p-2 text-dg-text-secondary hover:text-dg-text-primary transition-colors">
        <Bell size={18} />
        {unackedAlerts > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-dg-action text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unackedAlerts > 9 ? '9+' : unackedAlerts}
          </span>
        )}
      </button>

      <div className="w-8 h-8 rounded-full bg-dg-info/20 flex items-center justify-center text-dg-info text-sm font-semibold">
        {user?.name?.charAt(0) || 'U'}
      </div>
    </header>
  );
}
