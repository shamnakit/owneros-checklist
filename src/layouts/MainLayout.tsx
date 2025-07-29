// /src/layout/MainLayout.tsx
import dynamic from "next/dynamic";

// ✅ เปลี่ยนเป็น dynamic import ปิด SSR
const Sidebar = dynamic(() => import("@/components/Sidebar"), { ssr: false });

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {children}
      </div>
    </div>
  );
}
