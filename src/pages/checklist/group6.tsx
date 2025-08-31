// src/pages/checklist/group6.tsx
import AppShell from "../../components/layouts/AppShell";
import ChecklistGroupPage from "../../components/checklist/ChecklistGroupPage";

export default function Group6() {
  return (
    <AppShell title="Checklist หมวด 6: ลูกค้าและการตลาด/การขาย | BizSystem">
      <ChecklistGroupPage
        groupNo={6}
        categoryKey="sales"
        title="Checklist หมวด 6: ลูกค้าและการตลาด/การขาย"
        breadcrumb="Checklist › หมวด 6"
        requireEvidence={true}
      />
    </AppShell>
  );
}
