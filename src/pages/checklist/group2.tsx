// src/pages/checklist/group2.tsx
import Head from "next/head";
import ChecklistGroupPage from "@/components/checklist/ChecklistGroupPage";

export default function StructurePage() {
  return (
    <>
      <Head>
        <title>Checklist หมวด 2: โครงสร้างและการกำกับดูแล | BizSystem</title>
      </Head>
      <ChecklistGroupPage
        groupNo={2}
        categoryKey="structure"
        title="Checklist หมวด 2: โครงสร้างและการกำกับดูแล"
        breadcrumb="Checklist › หมวด 2"
        requireEvidence={false}
      />
    </>
  );
}
