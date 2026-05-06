/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        parchment: '#FAF6F0',
        'dp-dark': '#1A1A2E',
        'dp-text': '#2C2C2C',
        'dp-gold': '#C9A84C',
        'dp-copper': '#B87333',
        'dp-muted': '#8B8680',
        'dp-border': '#D4C5A9',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        accent: ['"Libre Baskerville"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
