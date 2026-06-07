import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'volta-black': '#000000',
        'volta-white': '#FFFFFF',
        'volta-yellow': '#FFE42B',
        'volta-green': '#009336',
        'volta-red': '#FB3615',
        'volta-blue': '#359EFE',
        'volta-dark': '#1A1A1A',
        'volta-cyan': '#359EFE',
        'volta-primary': '#359EFE',
      },
      fontFamily: {
        sans: ['Instrument Sans', 'Arial', 'sans-serif'],
      },
      keyframes: {
        'dropdown-in': {
          '0%': { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'device-enter': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'flow-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.95)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'energy-flow': {
          '0%': { strokeDashoffset: '40' },
          '100%': { strokeDashoffset: '0' },
        },
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px rgba(255,228,43,0.4))' },
          '50%': { filter: 'drop-shadow(0 0 12px rgba(255,228,43,0.8))' },
        },
      },
      animation: {
        'dropdown-in': 'dropdown-in 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fade-in 200ms ease-out',
        'modal-in': 'modal-in 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'device-enter': 'device-enter 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        shimmer: 'shimmer 2s linear infinite',
        'flow-pulse': 'flow-pulse 2s ease-in-out infinite',
        'energy-flow': 'energy-flow 1.5s linear infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
