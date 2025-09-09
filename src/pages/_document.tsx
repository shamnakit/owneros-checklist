// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="th">
      <Head />
      {/* ✅ บังคับธีมเข้าที่ body ทุกเพจ */}
      <body className="bg-space">{/* ทั้งเว็บมืด */}</body>

    </Html>
  );
}
