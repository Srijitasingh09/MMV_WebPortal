/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0072b1",
        secondary: "#FF9933",
        accent: "#E1AD01",
        muted: "#666666",
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
}
