module.exports = {
  mode: "jit",
  content: [
    "./src/**/**/*.{js,ts,jsx,tsx,html,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,html,mdx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      md: { max: "1050px" },
      sm: { max: "550px" },
    },
    extend: {
      colors: {
        black: {
          900: "var(--black_900)",
          "900_01": "var(--black_900_01)",
          "900_02": "var(--black_900_02)",
          "900_19": "var(--black_900_19)",
        },
        blue_gray: {
          900: "var(--blue_gray_900)",
        },
        deep_orange: {
          800: "var(--deep_orange_800)",
        },
        gray: {
          100: "var(--gray_100)",
          400: "var(--gray_400)",
          900: "var(--gray_900)",
          "400_01": "var(--gray_400_01)",
          "900_01": "var(--gray_900_01)",
          "900_02": "var(--gray_900_02)",
          "900_03": "var(--gray_900_03)",
        },
        red: {
          400: "var(--red_400)",
          900: "var(--red_900)",
        },
        teal: {
          500: "var(--teal_500)",
          900: "var(--teal_900)",
        },
        white: {
          a700: "var(--white_a700)",
        },
        yellow: {
          700: "var(--yellow_700)",
        },
      },
      boxShadow: {},
      fontFamily: {
        archivo: "Archivo",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
