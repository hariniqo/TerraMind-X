export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#12372A',
        'deep-forest': '#0B2118',
        leaf: '#4F7D32',
        'soft-green': '#DCE8C7',
        'harvest-gold': '#D8A928',
        'warm-cream': '#F7F4E9',
        earth: '#8A6B43',
        ink: '#172018',
        'secondary-text': '#596358',
        white: '#FFFFFF',
        'highlight-cream': '#F7F4E9',
        'tamil-gold': '#D8A928',
        'deep-green': '#0B2118',
        'paddy-green': '#10B981',
        'terra-green': '#22C55E',
        'earth-brown': '#A16207',
        terra: {
          50: '#F7F7F2',
          100: '#EFF0E4',
          200: '#DFE2C9',
          300: '#C9CB9E',
          400: '#A1AE75',
          500: '#7A8D44',
          600: '#5F6E32',
          700: '#4C5529',
          800: '#3C4321',
          900: '#2D3219'
        },
        amber: {
          50: '#FFF8E0',
          100: '#FFF0B8',
          200: '#FBD87B',
          300: '#F7C54A',
          400: '#F39D16',
          500: '#DB7A10',
          600: '#B35D0E',
          700: '#8A470D',
          800: '#69370C',
          900: '#4E270A'
        }
      },
      boxShadow: {
        card: '0 18px 40px rgba(33, 46, 34, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'Latha', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
