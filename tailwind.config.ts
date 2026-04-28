import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './data/**/*.mdx',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: '#0D2D24',
          dark: '#143A2E',
          deep: '#051811',
        },
        ink: { DEFAULT: '#18181B', soft: '#3A3A3D' },
        cream: { DEFAULT: '#FCFCFA', warm: '#F4F4F1', mist: '#EAEAE6' },
        muted: { DEFAULT: '#74746E', soft: '#9D9D97' },
        tangerine: { DEFAULT: '#FF6B3D', dark: '#FF5723' },
        magenta: { DEFAULT: '#E84B7A', soft: '#FCDCE6', dusty: '#D4407A' },
        pink: { soft: '#F4B6C2', blush: '#FDEEF1' },
        // Femme-without-pink pastels for the v2 redesign
        butter: { DEFAULT: '#F8E1A3', soft: '#FBF1D5' },
        peach: { DEFAULT: '#FFD3BC', soft: '#FFEEE3' },
        periwinkle: { DEFAULT: '#B8C2EE', soft: '#E5E9F8' },
        sage: { DEFAULT: '#5BA084', mist: '#A6BFA0', soft: '#E1ECDD' },
        lavender: { DEFAULT: '#C9B6E4', soft: '#EFEAF5' },
        sapphire: { DEFAULT: '#2D4ED1', soft: '#DDE7F1' },
        lemon: '#FBB731',
        lilac: '#B7A1E0',
        burgundy: '#6B1E3A',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        script: ['Caveat', 'cursive'],
      },
      borderRadius: {
        sm: '10px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(13,45,36,0.04), 0 12px 32px -10px rgba(13,45,36,0.10)',
        lift: '0 1px 2px rgba(13,45,36,0.06), 0 28px 56px -16px rgba(13,45,36,0.16)',
        deep: '0 4px 8px rgba(13,45,36,0.06), 0 40px 80px -20px rgba(13,45,36,0.22)',
      },
    },
  },
  plugins: [],
};

export default config;
