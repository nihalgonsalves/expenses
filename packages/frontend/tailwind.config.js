// eslint-disable-next-line import/no-extraneous-dependencies
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line import/no-default-export
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  daisyui: {
    darkTheme: 'expenses-dark',
    themes: [
      {
        'expenses-light': {
          'color-scheme': 'light',
          primary: '#38bdf8',
          'primary-content': '#d9f3fc',
          secondary: '#818CF8',
          accent: '#1ECEBC',
          'accent-content': '#07312D',
          neutral: '#2B3440',
          'neutral-content': '#D7DDE4',
          'base-100': '#ffffff',
          'base-200': '#F2F2F2',
          'base-300': '#E5E6E6',
          info: '#0CA5E9',
          'info-content': '#000000',
          success: '#2DD4BF',
          warning: '#F4BF50',
          error: '#FB7085',
        },
        'expenses-dark': {
          'color-scheme': 'dark',
          primary: '#38bdf8',
          secondary: '#818CF8',
          accent: '#F471B5',
          neutral: '#1E293B',
          'neutral-focus': '#273449',
          'base-100': '#0F172A',
          info: '#0CA5E9',
          'info-content': '#000000',
          success: '#2DD4BF',
          warning: '#F4BF50',
          error: '#FB7085',
        },
      },
      'light',
      'dark',
      'cupcake',
      'bumblebee',
      'emerald',
      'corporate',
      'synthwave',
      'retro',
      'cyberpunk',
      'valentine',
      'halloween',
      'garden',
      'forest',
      'aqua',
      'lofi',
      'pastel',
      'fantasy',
      'wireframe',
      'black',
      'luxury',
      'dracula',
      'cmyk',
      'autumn',
      'business',
      'acid',
      'lemonade',
      'night',
      'coffee',
      'winter',
    ],
  },
  plugins: [daisyui],
};
