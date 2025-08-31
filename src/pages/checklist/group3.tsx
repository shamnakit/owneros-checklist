// src/pages/checklist/group3.tsx
import AppShell from "@/components/layouts/AppShell";
import ChecklistGroupPage from "@/components/checklist/ChecklistGroupPage";

export default function Group3() {
  return (
    <AppShell title="Checklist หมวด 3: กระบวนการและคู่มือการทำงาน | BizSystem">
      <ChecklistGroupPage
        groupNo={3}
        categoryKey="sop"
        title="Checklist หมวด 3: กระบวนการและคู่มือการทำงาน"
        breadcrumb="Checklist › หมวด 3"
        requireEvidence={true}
      />
    </AppShell>
  );
}
