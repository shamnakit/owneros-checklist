// src/pages/checklist/group2.tsx
import AppShell from "@/components/layouts/AppShell";
import ChecklistGroupPage from "@/components/checklist/ChecklistGroupPage";

export default function Group2() {
  return (
    <AppShell title="Checklist หมวด 2: โครงสร้างและการกำกับดูแล | BizSystem">
      <ChecklistGroupPage
        groupNo={2}
        categoryKey="structure"
        title="Checklist หมวด 2: โครงสร้างและการกำกับดูแล"
        breadcrumb="Checklist › หมวด 2"
        requireEvidence={false}
      />
    </AppShell>
  );
}
