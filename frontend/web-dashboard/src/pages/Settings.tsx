import { useState } from 'react';
import { User, Bell, Sliders, Monitor, Users } from 'lucide-react';
import { useDrillGuard } from '../context/DrillGuardContext';

type Tab = 'profile' | 'notifications' | 'thresholds' | 'display' | 'team';

const TABS: Array<{ id: Tab; label: string; icon: typeof User }> = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'thresholds', label: 'Alert Thresholds', icon: Sliders },
  { id: 'display', label: 'Display', icon: Monitor },
  { id: 'team', label: 'Team', icon: Users },
];

export default function Settings() {
  const { user } = useDrillGuard();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [watchThreshold, setWatchThreshold] = useState(30);
  const [elevatedThreshold, setElevatedThreshold] = useState(50);
  const [actionThreshold, setActionThreshold] = useState(71);
  const [chartHeight, setChartHeight] = useState(120);
  const [refreshInterval, setRefreshInterval] = useState('10');
  const [defaultTimeRange, setDefaultTimeRange] = useState('24h');
  const [digestFreq, setDigestFreq] = useState('realtime');

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-lg font-semibold text-dg-text-primary mb-6">Settings</h1>

      <div className="flex gap-6">
        <nav className="w-48 shrink-0 hidden md:block">
          <div className="space-y-0.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'bg-dg-info/10 text-dg-info'
                    : 'text-dg-text-secondary hover:bg-dg-bg-card-hover hover:text-dg-text-primary'
                  }
                `}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 bg-dg-bg-card border border-dg-border rounded-xl p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-dg-text-primary">Profile</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-dg-info/20 flex items-center justify-center text-dg-info text-2xl font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-dg-text-primary font-medium">{user?.name}</p>
                  <p className="text-sm text-dg-text-secondary">{user?.email}</p>
                  <p className="text-xs text-dg-text-tertiary">{user?.role}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-dg-text-secondary mb-1.5">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    className="w-full h-10 bg-dg-bg-primary border border-dg-border rounded-lg px-3 text-sm text-dg-text-primary outline-none focus:border-dg-info"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dg-text-secondary mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="w-full h-10 bg-dg-bg-primary border border-dg-border rounded-lg px-3 text-sm text-dg-text-primary outline-none focus:border-dg-info"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dg-text-secondary mb-1.5">Role</label>
                  <input
                    type="text"
                    defaultValue={user?.role}
                    disabled
                    className="w-full h-10 bg-dg-bg-primary border border-dg-border rounded-lg px-3 text-sm text-dg-text-tertiary outline-none opacity-60"
                  />
                </div>
                <button className="h-10 px-6 bg-dg-info text-dg-bg-primary font-medium rounded-lg hover:bg-[#79C0FF] transition-colors text-sm">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-dg-text-primary">Notifications</h2>

              <div>
                <p className="text-sm text-dg-text-secondary mb-3">Channel preferences by severity</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-[11px] text-dg-text-tertiary uppercase tracking-wider pb-2 pr-4">Channel</th>
                        <th className="text-center text-[11px] text-dg-text-tertiary uppercase tracking-wider pb-2 px-4">Watch</th>
                        <th className="text-center text-[11px] text-dg-text-tertiary uppercase tracking-wider pb-2 px-4">Elevated</th>
                        <th className="text-center text-[11px] text-dg-text-tertiary uppercase tracking-wider pb-2 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['Push', 'Email', 'SMS'].map(channel => (
                        <tr key={channel} className="border-t border-dg-border-muted">
                          <td className="py-3 pr-4 text-sm text-dg-text-primary">{channel}</td>
                          {['watch', 'elevated', 'action'].map(sev => (
                            <td key={sev} className="py-3 px-4 text-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked={sev !== 'watch' || channel === 'Push'} className="sr-only peer" />
                                <div className="w-9 h-5 bg-dg-bg-card-active peer-focus:ring-2 peer-focus:ring-dg-info/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-dg-text-tertiary after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-dg-info peer-checked:after:bg-white" />
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-sm text-dg-text-primary font-medium mb-2">Digest Frequency</p>
                <div className="flex gap-3">
                  {[
                    { value: 'realtime', label: 'Real-time' },
                    { value: 'hourly', label: 'Hourly' },
                    { value: 'daily', label: 'Daily' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                        digestFreq === opt.value
                          ? 'border-dg-info bg-dg-info/10 text-dg-info'
                          : 'border-dg-border text-dg-text-secondary hover:bg-dg-bg-card-hover'
                      }`}
                    >
                      <input
                        type="radio"
                        name="digest"
                        value={opt.value}
                        checked={digestFreq === opt.value}
                        onChange={e => setDigestFreq(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'thresholds' && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-dg-text-primary">Alert Thresholds</h2>
              <p className="text-sm text-dg-text-secondary">Configure risk score thresholds for alert severity levels</p>

              {[
                { label: 'Watch Threshold', value: watchThreshold, setValue: setWatchThreshold, color: '#D29922', default: 30 },
                { label: 'Elevated Threshold', value: elevatedThreshold, setValue: setElevatedThreshold, color: '#E87C25', default: 50 },
                { label: 'Action Threshold', value: actionThreshold, setValue: setActionThreshold, color: '#F85149', default: 71 },
              ].map(threshold => (
                <div key={threshold.label}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-dg-text-primary font-medium">{threshold.label}</label>
                    <span className="font-mono text-sm font-bold tabular-nums" style={{ color: threshold.color }}>
                      {threshold.value}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={threshold.value}
                      onChange={e => threshold.setValue(Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #2EA043 0%, #D29922 30%, #E87C25 50%, #F85149 71%, #F85149 100%)`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-dg-text-tertiary mt-1">Default: {threshold.default}</p>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dg-border">
                <div>
                  <label className="block text-xs font-medium text-dg-text-secondary mb-1.5">Deduplication Window (min)</label>
                  <input
                    type="number"
                    defaultValue={15}
                    className="w-full h-10 bg-dg-bg-primary border border-dg-border rounded-lg px-3 text-sm text-dg-text-primary outline-none focus:border-dg-info"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dg-text-secondary mb-1.5">Escalation Timeout (min)</label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full h-10 bg-dg-bg-primary border border-dg-border rounded-lg px-3 text-sm text-dg-text-primary outline-none focus:border-dg-info"
                  />
                </div>
              </div>

              <button className="h-10 px-6 bg-dg-info text-dg-bg-primary font-medium rounded-lg hover:bg-[#79C0FF] transition-colors text-sm">
                Save Thresholds
              </button>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-dg-text-primary">Display Preferences</h2>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-dg-text-primary font-medium">Chart Height</label>
                  <span className="font-mono text-sm text-dg-text-secondary tabular-nums">{chartHeight}px</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={200}
                  value={chartHeight}
                  onChange={e => setChartHeight(Number(e.target.value))}
                  className="w-full h-2 bg-dg-bg-card-active rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-dg-text-secondary mb-1.5">Default Time Range</label>
                <select
                  value={defaultTimeRange}
                  onChange={e => setDefaultTimeRange(e.target.value)}
                  className="w-full h-10 bg-dg-bg-primary border border-dg-border rounded-lg px-3 text-sm text-dg-text-primary outline-none focus:border-dg-info"
                >
                  <option value="1h">1 Hour</option>
                  <option value="6h">6 Hours</option>
                  <option value="12h">12 Hours</option>
                  <option value="24h">24 Hours</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-dg-text-secondary mb-1.5">Data Refresh Interval</label>
                <div className="flex gap-2">
                  {['5', '10', '30', '60'].map(val => (
                    <button
                      key={val}
                      onClick={() => setRefreshInterval(val)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                        refreshInterval === val
                          ? 'border-dg-info bg-dg-info/10 text-dg-info'
                          : 'border-dg-border text-dg-text-secondary hover:bg-dg-bg-card-hover'
                      }`}
                    >
                      {val}s
                    </button>
                  ))}
                </div>
              </div>

              <button className="h-10 px-6 bg-dg-info text-dg-bg-primary font-medium rounded-lg hover:bg-[#79C0FF] transition-colors text-sm">
                Save Preferences
              </button>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-dg-text-primary">Team Management</h2>
              <p className="text-sm text-dg-text-secondary">Manage team members and their roles</p>

              <div className="space-y-3">
                {[
                  { name: 'Johnpaul Eze', email: 'johnpaul@drillguard.ng', role: 'Admin' },
                  { name: 'Adaeze Okafor', email: 'adaeze@drillguard.ng', role: 'Drilling Engineer' },
                  { name: 'Chinedu Nwosu', email: 'chinedu@drillguard.ng', role: 'Data Analyst' },
                ].map(member => (
                  <div key={member.email} className="flex items-center justify-between p-3 rounded-lg border border-dg-border">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-dg-info/20 flex items-center justify-center text-dg-info text-sm font-semibold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-dg-text-primary">{member.name}</p>
                        <p className="text-xs text-dg-text-tertiary">{member.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded text-xs text-dg-text-secondary border border-dg-border">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>

              <button className="h-10 px-6 border border-dg-info text-dg-info font-medium rounded-lg hover:bg-dg-info/10 transition-colors text-sm">
                Invite Team Member
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
