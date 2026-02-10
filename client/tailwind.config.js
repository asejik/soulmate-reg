/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Sets Poppins as the default for the whole site
        sans: ['Poppins', 'sans-serif'],
        // Creates a specific utility 'font-heading' for Montserrat
        heading: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}