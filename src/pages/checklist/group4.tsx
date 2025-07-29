// pages/checklist/group4.tsx
import dynamic from "next/dynamic";

// ✅ ปิด SSR เพื่อหลีกเลี่ยง useUserProfile error
const Group4Checklist = dynamic(
  () => import("@/components/checklist/Group4Page"),
  { ssr: false }
);

export default function Group4Page() {
  return <Group4Checklist />;
}
