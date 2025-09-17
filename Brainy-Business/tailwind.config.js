/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      backgroundColor: {
        'body': '#ffffff',
      },
      screens: {
        'phone': '50px',
        'tablet': '768px',
        'pc': '1024px',
      },
    },
  },
  plugins: [require("daisyui")],
};