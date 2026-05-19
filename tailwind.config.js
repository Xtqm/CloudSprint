export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1464a0',
          secondary: '#3c5064',
          accent: '#dcf0f0',
          bg: '#f5f9fa'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        footer: '0 20px 45px rgba(15, 23, 42, 0.28)',
      },
    },
  },
  plugins: [],
};
