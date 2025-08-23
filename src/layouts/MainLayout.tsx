// /src/layout/MainLayout.tsx
import dynamic from "next/dynamic";
import Head from "next/head";
import React from "react";

// ✅ ปิด SSR ของ Sidebar กัน auth/profile โหลดไม่ทัน + ใส่ fallback กันจอว่าง
const Sidebar = dynamic(() => import("@/components/Sidebar"), {
  ssr: false,
  loading: () => (
    <div className="hidden md:block w-72 shrink-0 border-r border-gray-200 bg-white" />
  ),
});

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <title>OwnerOS</title>
      </Head>

      <div className="min-h-screen bg-gray-50 text-gray-900">
        <div className="flex">
          {/* Sidebar (desktop) */}
          <aside className="hidden md:block w-72 shrink-0 border-r border-gray-200 bg-white">
            <Sidebar />
          </aside>

          {/* Topbar (mobile) */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-30 border-b bg-white/90 backdrop-blur">
            <div className="px-4 py-3 font-semibold">OwnerOS</div>
          </div>

          {/* Main content */}
          <main
            className="
              flex-1 
              min-h-screen 
              overflow-y-auto 
              p-4 md:p-6 
              md:ml-0
              pt-16 md:pt-6  /* เผื่อพื้นที่ให้ topbar บนมือถือ */
            "
          >
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
