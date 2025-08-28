// src/pages/checklist/group4.tsx
import AppShell from "@/components/layouts/AppShell";
import ChecklistGroupPage from "@/components/checklist/ChecklistGroupPage";

export default function Group4() {
  return (
    <AppShell title="Checklist หมวด 4: บุคลากรและการพัฒนา HR | BizSystem">
      <ChecklistGroupPage
        groupNo={4}
        categoryKey="hr"
        title="Checklist หมวด 4: บุคลากรและการพัฒนา HR"
        breadcrumb="Checklist › หมวด 4"
        requireEvidence={false}
      />
    </AppShell>
  );
}
