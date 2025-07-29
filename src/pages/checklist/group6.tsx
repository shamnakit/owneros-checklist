// pages/checklist/group6.tsx
import dynamic from "next/dynamic";

// ✅ ปิด SSR ของทั้งหน้า (รวม MainLayout และ Sidebar ที่ใช้ context)
const Group6Page = dynamic(() => import("@/components/checklist/Group6Page"), {
  ssr: false,
});

export default function Page() {
  return <Group6Page />;
}
