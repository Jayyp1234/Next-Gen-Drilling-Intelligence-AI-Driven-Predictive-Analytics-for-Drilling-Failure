/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dg: {
          'bg-primary': 'var(--dg-bg-primary)',
          'bg-card': 'var(--dg-bg-card)',
          'bg-card-hover': 'var(--dg-bg-card-hover)',
          'bg-card-active': 'var(--dg-bg-card-active)',
          'border': 'var(--dg-border)',
          'border-muted': 'var(--dg-border-muted)',
          'text-primary': 'var(--dg-text-primary)',
          'text-secondary': 'var(--dg-text-secondary)',
          'text-tertiary': 'var(--dg-text-tertiary)',
          'info': 'var(--dg-info)',
          'ml-accent': '#8E32E9',
          'normal': '#2EA043',
          'watch': '#D29922',
          'elevated': '#E87C25',
          'action': '#F85149',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '4.5': '18px',
        '13': '52px',
        '15': '60px',
        '18': '72px',
        '22': '88px',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      zIndex: {
        raised: '1',
        dropdown: '10',
        sidebar: '20',
        topbar: '30',
        overlay: '40',
        modal: '50',
        toast: '60',
        tooltip: '70',
      },
      animation: {
        'pulse-action': 'pulseAction 2s ease-in-out infinite',
        'slide-in-up': 'slideInUp 250ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        'gauge-sweep': 'gaugeSweep 800ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fadeIn 200ms ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'logo-glow': 'logoGlow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseAction: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        slideInUp: {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        gaugeSweep: {
          from: { strokeDashoffset: '100%' },
          to: { strokeDashoffset: '0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(248, 81, 73, 0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(248, 81, 73, 0.6)' },
        },
        logoGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 6px rgba(88, 166, 255, 0.25))' },
          '50%': { opacity: '0.95', filter: 'drop-shadow(0 0 12px rgba(88, 166, 255, 0.4))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      backgroundImage: {
        'login-grid': `linear-gradient(var(--dg-border) 1px, transparent 1px),
          linear-gradient(90deg, var(--dg-border) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'login-grid': '24px 24px',
      },
    },
  },
  plugins: [],
};
