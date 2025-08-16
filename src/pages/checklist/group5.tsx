// src/pages/checklist/group5.tsx
import dynamic from "next/dynamic";
const ChecklistGroupPage = dynamic(() => import("@/components/checklist/ChecklistGroupPage"), { ssr: false });
export default function Group5() {
  return <ChecklistGroupPage groupName="ระบบการเงิน" groupNo={5} />;
}
