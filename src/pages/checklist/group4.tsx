// src/pages/checklist/group4.tsx
import dynamic from "next/dynamic";
const ChecklistGroupPage = dynamic(() => import("@/components/checklist/ChecklistGroupPage"), { ssr: false });
export default function Group4() {
  return <ChecklistGroupPage groupName="ระบบบุคคล & HR" groupNo={4} />;
}
