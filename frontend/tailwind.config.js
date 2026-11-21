/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#FAF7F2',
          card: '#FFFFFF',
          subtle: '#F5EFEB',
          sand: '#EAE3D9'
        },
        forest: {
          DEFAULT: '#1A2922',
          muted: '#53645C',
          dark: '#121D18'
        },
        terracotta: {
          DEFAULT: '#C85A32',
          soft: '#F9EBE6',
          border: '#F2D1C5'
        },
        ochre: {
          DEFAULT: '#D18820',
          soft: '#FBF4E6'
        },
        sage: {
          DEFAULT: '#3D6B56',
          soft: '#EAF2ED',
          border: '#CDE0D4',
          accent: '#52B788'
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
