/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        abi: {
          bg: '#0a0a0f',
          'bg-elevated': '#12121a',
          'bg-card': '#1a1a24',
          'bg-hover': '#22222e',
          border: '#2a2a3a',
          'border-glow': '#3a3a4a',
          orange: '#FF5500',
          'orange-light': '#FF7733',
          'orange-dark': '#CC4400',
          text: '#e8e8ed',
          'text-muted': '#8888a0',
          'text-dim': '#5a5a70',
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 85, 0, 0.3)',
        'glow-sm': '0 0 10px rgba(255, 85, 0, 0.2)',
        'glow-lg': '0 0 40px rgba(255, 85, 0, 0.4)',
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
        elevated: '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'border-flow': 'border-flow 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 85, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 85, 0, 0.5)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'border-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
    },
  },
  plugins: [],
};
