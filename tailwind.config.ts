import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui compatible colors using CSS variables
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Primary turquoise palette
        turquoise: {
          50: '#effefb',
          100: '#c7fff4',
          200: '#90ffea',
          300: '#51f7dd',
          400: '#1de4c9',
          500: '#05c8b0', // Primary brand color
          600: '#00a192',
          700: '#058076',
          800: '#0a655f',
          900: '#0d544f',
          950: '#003332',
        },
        // Accent colors
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          cyan: '#06b6d4',
          teal: '#14b8a6',
          emerald: '#10b981',
        },
        // Background colors with grain support
        surface: {
          light: '#fcfbf8',
          dark: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      backgroundImage: {
        // Complex gradient backgrounds
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':
          'radial-gradient(at 40% 20%, hsla(174, 97%, 40%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(174, 97%, 40%, 0.2) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(189, 100%, 56%, 0.15) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(174, 97%, 40%, 0.15) 0px, transparent 50%)',
        'gradient-mesh-dark':
          'radial-gradient(at 40% 20%, hsla(174, 97%, 30%, 0.4) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 40%, 0.3) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(174, 97%, 30%, 0.25) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(189, 100%, 40%, 0.2) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(174, 97%, 30%, 0.2) 0px, transparent 50%)',
        // Hero gradient
        'hero-gradient':
          'linear-gradient(135deg, hsla(174, 97%, 40%, 0.1) 0%, hsla(189, 100%, 56%, 0.05) 50%, hsla(174, 97%, 40%, 0.1) 100%)',
        'hero-gradient-dark':
          'linear-gradient(135deg, hsla(174, 97%, 30%, 0.2) 0%, hsla(189, 100%, 40%, 0.1) 50%, hsla(174, 97%, 30%, 0.2) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'fade-in-down': 'fadeInDown 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px hsla(174, 97%, 40%, 0.3)' },
          '100%': { boxShadow: '0 0 40px hsla(174, 97%, 40%, 0.6)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px hsla(174, 97%, 40%, 0.3)',
        'glow': '0 0 25px -5px hsla(174, 97%, 40%, 0.4)',
        'glow-lg': '0 0 50px -12px hsla(174, 97%, 40%, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};

export default config;
