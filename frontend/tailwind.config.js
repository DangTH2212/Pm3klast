/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dark: {
          100: '#1e293b',
          200: '#1a1f2e',
          300: '#151922',
          400: '#0f1117',
          500: '#0a0c10',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'tiktok-gradient': 'linear-gradient(135deg, #00f2ea 0%, #ff0050 50%, #00f2ea 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 242, 234, 0.3)',
        'glow-pink': '0 0 20px rgba(255, 0, 80, 0.3)',
      }
    },
  },
  plugins: [],
}
