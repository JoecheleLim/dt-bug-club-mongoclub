/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0D1117',
          card: '#161B22',
          border: '#30363D',
          text: '#C9D1D9',
          primary: '#58A6FF',
          secondary: '#79C0FF',
          accent: '#BC8CFF',
          dt: '#3742fa',
          bug: '#2ed573',
          ace: '#ffa502',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
