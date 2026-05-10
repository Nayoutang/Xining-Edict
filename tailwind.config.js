/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        song: ['Noto Serif SC', 'SimSun', 'Songti SC', 'serif'],
        sans: ['Noto Sans SC', 'Microsoft YaHei', 'sans-serif'],
      },
      colors: {
        paper: '#f4ecd8',
        paperDeep: '#dfcfad',
        ink: '#191713',
        moss: '#5f766b',
        tealgray: '#7f9692',
        cinnabar: '#9b2f25',
        brownInk: '#5d4632',
      },
      boxShadow: {
        scroll: '0 24px 70px rgba(45, 28, 10, 0.18)',
        seal: '0 10px 22px rgba(114, 25, 18, 0.24)',
      },
    },
  },
  plugins: [],
};
