import { useLocation, useNavigate } from 'react-router-dom';
import { Gauge, Bell, Clock, Settings, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useDrillGuard } from '../../context/DrillGuardContext';
import { RISK_COLORS } from '../../lib/constants';
import Logo from '../common/Logo';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { path: '/dashboard', icon: Gauge, label: 'Fleet Overview' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
  { path: '/history', icon: Clock, label: 'Historical Analysis' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { wells, alerts, user, logout } = useDrillGuard();
  const unackedAlerts = alerts.filter(a => a.status === 'new').length;

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full bg-dg-bg-primary border-r border-dg-border z-sidebar
        transition-all duration-200 flex flex-col
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      <div className="h-14 flex items-center px-4 border-b border-dg-border shrink-0">
        <Logo size={28} className="shrink-0" />
        {!collapsed && (
          <span className="ml-2 text-base font-semibold text-dg-text-primary">DrillGuard</span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto text-dg-text-tertiary hover:text-dg-text-secondary transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="mt-2 px-2 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 h-10 rounded-lg px-3 transition-all duration-150
                ${isActive
                  ? 'bg-dg-info/10 text-dg-info border-l-2 border-dg-info'
                  : 'text-dg-text-secondary hover:bg-dg-bg-card-hover hover:text-dg-text-primary'
                }
              `}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
              {item.path === '/alerts' && unackedAlerts > 0 && (
                <span className="ml-auto bg-dg-action text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unackedAlerts}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mt-4 px-4">
          <p className="text-[11px] uppercase tracking-wider text-dg-text-tertiary font-medium mb-2">Your Wells</p>
          <div className="space-y-0.5 max-h-[calc(100vh-400px)] overflow-y-auto">
            {wells.map(well => (
              <button
                key={well.id}
                onClick={() => navigate(`/wells/${well.id}`)}
                className={`
                  w-full flex items-center gap-2 py-1.5 px-2 rounded text-left transition-colors
                  ${location.pathname === `/wells/${well.id}`
                    ? 'bg-dg-bg-card-active text-dg-text-primary'
                    : 'text-dg-text-secondary hover:bg-dg-bg-card-hover hover:text-dg-text-primary'
                  }
                `}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${well.risk_level === 'ACTION' ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: RISK_COLORS[well.risk_level] }}
                />
                <span className="text-sm truncate">{well.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto p-3 border-t border-dg-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-dg-info/20 flex items-center justify-center text-dg-info text-sm font-semibold shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-dg-text-primary truncate">{user?.name}</p>
              <p className="text-[11px] text-dg-text-tertiary truncate">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="text-dg-text-tertiary hover:text-dg-action transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
