// src/pages/checklist/group2.tsx
import dynamic from "next/dynamic";
const ChecklistGroupPage = dynamic(() => import("@/components/checklist/ChecklistGroupPage"), { ssr: false });
export default function Group2() {
  return <ChecklistGroupPage groupName="โครงสร้างองค์กร" groupNo={2} />;
}
