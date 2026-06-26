/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#FFC700', // Kuning
        softprimary: '#FFF3D6', // Kuning Muda
        accent: '#FF9800', // Oranye
      }
    },
  },
  plugins: [],
}