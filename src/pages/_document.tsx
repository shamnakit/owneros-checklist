// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="th">
      <Head />
      {/* ใส่ class ธีมที่นี่ได้ ปลอดภัย */}
      <body className="bg-space">
        <Main />
        {/* องค์ประกอบสำคัญ: สร้าง __NEXT_DATA__ */}
        <NextScript />
      </body>
    </Html>
  );
}
