/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        custom: '20px', // You can change this value to match your CSS variable
      },
      colors: {
        bgPrimary: '#FF269E',
        bgSecondary: '#2C3338',
        activeGreen: '#BEFDC0',
        customGray: '#D9D9D9',
      },
      
      backgroundImage: {
        'custom-gradient': 'linear-gradient(to bottom, #0F3316 3%, #130B2B 100%)',
      },
    },
  },
  plugins: [],
}