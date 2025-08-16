// src/pages/checklist/index.tsx
import dynamic from "next/dynamic";

// ใช้ dynamic เพื่อกัน client-only component พังบน SSR
const ChecklistDashboard = dynamic(
  () => import("@/components/ChecklistDashboard"),
  { ssr: false }
);

export default function ChecklistIndex() {
  return <ChecklistDashboard />;
}
