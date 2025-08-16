// src/pages/checklist/group6.tsx
import dynamic from "next/dynamic";
const ChecklistGroupPage = dynamic(() => import("@/components/checklist/ChecklistGroupPage"), { ssr: false });
export default function Group6() {
  return <ChecklistGroupPage groupName="ระบบลูกค้า / ขาย" groupNo={6} />;
}
