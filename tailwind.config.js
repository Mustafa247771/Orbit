/** @type {import('tailwindcss').Config} */
const colors = require("./src/theme/colors");
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      fontFamily: {
        display: ["SpaceGrotesk_600SemiBold"],
        mono: ["JetBrainsMono_500Medium"],
      },
    },
  },
  plugins: [],
};
