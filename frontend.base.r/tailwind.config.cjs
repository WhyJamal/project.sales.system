/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        genblue: '#0a66e0',
      },
      fontFamily: {
        sans: ['"72"', 'Inter', 'sans-serif'], 
        mono: ['"72Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
