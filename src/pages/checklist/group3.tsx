// src/pages/checklist/group3.tsx
import Head from "next/head";
import ChecklistGroupPage from "@/components/checklist/ChecklistGroupPage";

export default function SopPage() {
  return (
    <>
      <Head>
        <title>Checklist หมวด 3: กระบวนการและคู่มือการทำงาน | BizSystem</title>
      </Head>
      <ChecklistGroupPage
        groupNo={3}
        categoryKey="sop"
        title="Checklist หมวด 3: กระบวนการและคู่มือการทำงาน"
        breadcrumb="Checklist › หมวด 3"
        requireEvidence={false}
      />
    </>
  );
}
