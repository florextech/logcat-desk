/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        panel: '0 22px 80px rgba(4, 9, 5, 0.34)',
        glow: '0 0 0 1px rgba(189, 241, 70, 0.08), 0 18px 64px rgba(5, 9, 4, 0.52)'
      },
      colors: {
        flx: {
          bg: '#0b0d0c',
          surface: '#111513',
          muted: '#171c19',
          border: '#263028',
          foreground: '#edf6ee',
          soft: '#b8c4ba',
          brand: '#bdf146',
          brandhi: '#d7ff6d',
          brandlow: '#9ddf4b'
        },
        signal: {
          blue: '#7dd3fc',
          amber: '#f59e0b',
          red: '#ef4444',
          lime: '#bdf146'
        }
      },
      fontFamily: {
        sans: ['Poppins', '"SF Pro Display"', '"IBM Plex Sans"', '"Segoe UI"', 'sans-serif'],
        display: ['Montserrat', 'Poppins', '"SF Pro Display"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SFMono-Regular"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
