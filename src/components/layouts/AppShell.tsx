// src/components/layouts/AppShell.tsx
import Head from "next/head";
import Sidebar from "@/components/Sidebar";
import React from "react";

type Props = {
  title?: string;
  children: React.ReactNode;
};

export default function AppShell({ title = "BizSystem", children }: Props) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Sidebar: fixed เต็มซ้ายจอ */}
      <Sidebar />

      {/* Main: เว้นซ้าย 256px (w-64) เพื่อไม่ทับ sidebar */}
      <main className="min-h-screen bg-slate-50 pl-64">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </>
  );
}
