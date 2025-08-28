// src/pages/checklist/group1.tsx
import Head from "next/head";
import ChecklistGroupPage from "@/components/checklist/ChecklistGroupPage";

export default function StrategyPage() {
  return (
    <>
      <Head>
        <title>Checklist หมวด 1: กลยุทธ์และทิศทางองค์กร | BizSystem</title>
      </Head>
      <ChecklistGroupPage
        groupNo={1}
        categoryKey="strategy"
        title="Checklist หมวด 1: กลยุทธ์และทิศทางองค์กร"
        breadcrumb="Checklist › หมวด 1"
        requireEvidence={false}
      />
    </>
  );
}
