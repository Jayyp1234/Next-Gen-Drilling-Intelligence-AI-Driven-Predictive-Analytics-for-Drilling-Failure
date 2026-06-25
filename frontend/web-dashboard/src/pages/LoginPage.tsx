import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, Sun, Moon, Gauge, AlertCircle } from 'lucide-react';
import { useDrillGuard } from '../context/DrillGuardContext';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/common/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useDrillGuard();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dg-bg-primary flex flex-col md:flex-row overflow-hidden relative">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-[100] p-2 rounded-lg bg-dg-bg-card border border-dg-border text-dg-text-secondary hover:text-dg-text-primary transition-colors"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Visual panel – desktop */}
      <div className="relative hidden md:flex w-full md:w-1/2 lg:w-3/5 bg-dg-bg-primary flex-col justify-between overflow-hidden border-r border-dg-border">
        <div
          className="absolute inset-0 z-0 opacity-[0.4] dark:opacity-30"
          style={{
            backgroundImage: 'linear-gradient(var(--dg-border) 1px, transparent 1px), linear-gradient(90deg, var(--dg-border) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute inset-0 login-glow-overlay z-0" />

        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-60">
          <span
            className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-dg-info shadow-[0_0_15px_var(--dg-info)] animate-pulse"
            style={{ opacity: 0.8 }}
          />
          <span
            className="absolute top-1/3 left-2/3 w-3 h-3 rounded-full bg-dg-info shadow-[0_0_20px_var(--dg-info)] animate-pulse"
            style={{ opacity: 0.6, animationDelay: '1s' }}
          />
          <span
            className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-dg-info shadow-[0_0_10px_var(--dg-info)] animate-pulse"
            style={{ opacity: 0.5, animationDelay: '2s' }}
          />
        </div>

        <div className="relative z-10 p-10 lg:p-12 flex flex-col h-full justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-dg-info/10 p-2 rounded-lg border border-dg-info/30 backdrop-blur-sm">
              <Logo size={28} animated={false} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-dg-text-primary">DrillGuard</span>
          </div>

          <div className="flex-grow flex items-center justify-center">
            <div className="relative w-64 h-64 animate-float">
              <div className="absolute inset-0 bg-dg-info/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative z-10 bg-dg-bg-card border border-dg-info/30 p-8 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <div className="text-dg-info drop-shadow-[0_0_15px_rgba(88,166,255,0.5)]">
                  <Gauge size={48} strokeWidth={1.5} />
                </div>
                <div className="w-full bg-dg-bg-primary rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-dg-info h-full rounded-full animate-pulse"
                    style={{ width: '66%' }}
                  />
                </div>
                <div className="flex justify-between w-full text-[10px] font-mono text-dg-info/80">
                  <span>R.P.M.</span>
                  <span>2450</span>
                </div>
                <div className="flex justify-between w-full text-[10px] font-mono text-dg-info/80">
                  <span>TEMP</span>
                  <span>NORMAL</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="max-w-md">
              <h1 className="text-3xl lg:text-4xl font-bold text-dg-text-primary mb-2 leading-tight">
                AI-Powered Drilling Intelligence
              </h1>
              <p className="text-dg-text-secondary text-base lg:text-lg font-light">
                Advanced failure prediction for high-stakes engineering environments.
              </p>
            </div>
            <div className="flex gap-4 pt-4 border-t border-dg-border">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-dg-info">99.8%</span>
                <span className="text-xs text-dg-text-tertiary uppercase tracking-wider">Prediction accuracy</span>
              </div>
              <div className="w-px bg-dg-border self-stretch min-h-[40px]" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-dg-info">&lt;50ms</span>
                <span className="text-xs text-dg-text-tertiary uppercase tracking-wider">Latency</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 bg-dg-bg-primary">
        <div className="w-full max-w-[400px]">
          <div className="md:hidden flex items-center justify-center gap-2 mb-8">
            <Logo size={32} />
            <span className="text-2xl font-bold text-dg-text-primary">DrillGuard</span>
          </div>

          <div className="bg-dg-bg-card border border-dg-border rounded-xl shadow-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-dg-info to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="mb-8 text-center md:text-left">
              <h2 className="text-2xl font-semibold text-dg-text-primary mb-2">Welcome back</h2>
              <p className="text-dg-text-secondary text-sm">Please enter your credentials to access the dashboard.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-dg-action/10 border border-dg-action/30 mb-4 animate-slide-in-up">
                <AlertCircle size={16} className="text-dg-action shrink-0" />
                <span className="text-sm text-dg-action">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-dg-text-secondary uppercase tracking-wide ml-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dg-text-tertiary">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="engineer@drillguard.com"
                    disabled={loading}
                    className="block w-full pl-10 pr-3 py-2.5 bg-dg-bg-primary border border-dg-border rounded-lg text-dg-text-primary placeholder-dg-text-tertiary focus:outline-none focus:ring-2 focus:ring-dg-info/50 transition-all text-sm disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-dg-text-secondary uppercase tracking-wide ml-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dg-text-tertiary">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={loading}
                    className="block w-full pl-10 pr-10 py-2.5 bg-dg-bg-primary border border-dg-border rounded-lg text-dg-text-primary placeholder-dg-text-tertiary focus:outline-none focus:ring-2 focus:ring-dg-info/50 transition-all text-sm disabled:opacity-60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dg-text-tertiary hover:text-dg-text-secondary"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-dg-border bg-dg-bg-primary text-dg-info focus:ring-dg-info/50"
                  />
                  <span className="ml-2 block text-sm text-dg-text-secondary">Remember me</span>
                </label>
                <button type="button" className="text-sm font-medium text-dg-info hover:underline">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-dg-bg-primary bg-dg-info hover:opacity-90 transition-all transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="relative mt-8 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dg-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-dg-bg-card text-xs text-dg-text-tertiary">System access required</span>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-dg-text-tertiary">
              Need access?{' '}
              <button type="button" className="text-dg-info hover:underline">
                Contact administrator
              </button>
            </p>

            <div className="mt-8 flex items-center justify-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dg-normal opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-dg-normal" />
              </span>
              <span className="text-[10px] text-dg-text-tertiary font-mono">SYSTEM OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
