/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#121212',
        'dark-surface': '#1e1e1e',
        'dark-border': '#2d2d2d',
        'accent-red': '#e50914',
        'accent-amber': '#ffa500',
        'accent-green': '#00d4aa',
      },
    },
  },
  plugins: [],
}

