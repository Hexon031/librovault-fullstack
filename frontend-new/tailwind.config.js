/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Add custom animations and keyframes here
      animation: {
        'text-gradient': 'text-gradient 3s linear infinite',
        'page-turn': 'page-turn 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'text-gradient': {
          'to': {
            backgroundPosition: '200% center',
          },
        },
        'page-turn': {
          '0%': { transform: 'rotateY(0deg)', transformOrigin: 'left center' },
          '50%': { transform: 'rotateY(-45deg)', transformOrigin: 'left center' },
          '100%': { transform: 'rotateY(0deg)', transformOrigin: 'left center' },
        },
      },
    },
  },
  plugins: [],
}