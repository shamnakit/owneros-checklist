import dynamic from "next/dynamic";

// ✅ ปิด SSR เพื่อหลีกเลี่ยง useUserProfile error
const Group2Checklist = dynamic(
  () => import("@/components/checklist/Group2Page"),
  { ssr: false }
);

export default function Group2Page() {
  return <Group2Checklist />;
}
