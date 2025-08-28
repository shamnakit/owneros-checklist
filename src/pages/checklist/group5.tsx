// src/pages/checklist/group5.tsx
import AppShell from "@/components/layouts/AppShell";
import ChecklistGroupPage from "@/components/checklist/ChecklistGroupPage";

export default function Group5() {
  return (
    <AppShell title="Checklist หมวด 5: การเงินและการวัดผล | BizSystem">
      <ChecklistGroupPage
        groupNo={5}
        categoryKey="finance"
        title="Checklist หมวด 5: การเงินและการวัดผล"
        breadcrumb="Checklist › หมวด 5"
        requireEvidence={false}
      />
    </AppShell>
  );
}
