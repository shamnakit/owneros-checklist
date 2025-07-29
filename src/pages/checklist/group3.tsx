// pages/checklist/group3.tsx
import dynamic from "next/dynamic";

// ✅ ปิด SSR เพื่อหลีกเลี่ยงปัญหา context provider
const Group3Checklist = dynamic(
  () => import("@/components/checklist/Group3Page"),
  { ssr: false }
);

export default function Group3Page() {
  return <Group3Checklist />;
}
