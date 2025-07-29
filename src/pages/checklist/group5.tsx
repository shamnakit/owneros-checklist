import dynamic from "next/dynamic";

// ✅ ปิด SSR เพื่อหลีกเลี่ยง useUserProfile error
const Group5Checklist = dynamic(
  () => import("@/components/checklist/Group5Page"),
  { ssr: false }
);

export default function Group5Page() {
  return <Group5Checklist />;
}
