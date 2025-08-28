// src/pages/checklist/group1.tsx
import AppShell from "@/components/layouts/AppShell";
import ChecklistGroupPage from "@/components/checklist/ChecklistGroupPage";

export default function Group1() {
  return (
    <AppShell title="Checklist หมวด 1: กลยุทธ์และทิศทางองค์กร | BizSystem">
      <ChecklistGroupPage
        groupNo={1}
        categoryKey="strategy"
        title="Checklist หมวด 1: กลยุทธ์และทิศทางองค์กร"
        breadcrumb="Checklist › หมวด 1"
        requireEvidence={false}
      />
    </AppShell>
  );
}
