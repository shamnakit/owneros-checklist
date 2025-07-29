// pages/checklist/index.tsx
import dynamic from "next/dynamic";

// ปิด SSR เพื่อไม่ให้โหลด useUserProfile ขณะ server render
const ChecklistDashboard = dynamic(
  () => import("@/pages/ChecklistDashboard"),
  { ssr: false }
);

export default function ChecklistPage() {
  return <ChecklistDashboard />;
}
