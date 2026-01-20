/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "mates-blue": "#C2D1D3",
        "mates-orange": "#FF9800",
        background: "#ECEAE1",
      },
      borderRadius: {
        "3.5xl": "2rem",
        "4xl": "2.5rem",
        "5xl": "3rem",
      },
      boxShadow: {
        custom:
          "2px 4px 5px -1px rgba(0, 0, 0, 0.05), -2px -2px 10px -4px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
