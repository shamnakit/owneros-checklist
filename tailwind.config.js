/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",       // ใช้งานอยู่แน่นอน
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",       // เผื่ออนาคตใช้ App Router
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EBF2FF",
          100: "#D6E6FF",
          200: "#BDD6FF",
          300: "#91BAFF",
          400: "#6CA3FF",
          500: "#3B82F6",
          600: "#2D7CFF",    // ปุ่ม/กราฟหลัก
          700: "#1E60D8",
          800: "#184BAA",
          900: "#133B86",
        },
        accent: {
          500: "#7C3AED",    // ฮาโลม่วงตาม mock
        },
      },
    },
  },
  plugins: [],
};
