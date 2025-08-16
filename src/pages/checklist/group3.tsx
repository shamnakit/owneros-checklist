// src/pages/checklist/group3.tsx
import dynamic from "next/dynamic";
const ChecklistGroupPage = dynamic(() => import("@/components/checklist/ChecklistGroupPage"), { ssr: false });
export default function Group3() {
  return <ChecklistGroupPage groupName="คู่มือปฏิบัติงาน" groupNo={3} />;
}
