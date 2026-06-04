/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        surfaceHighlight: '#334155',
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        accent: '#8b5cf6',
        textMain: '#f8fafc',
        textMuted: '#94a3b8',
        border: '#334155',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
      }
    },
  },
  plugins: [],
}
