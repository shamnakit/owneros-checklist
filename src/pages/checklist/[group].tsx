import dynamic from "next/dynamic";
import MainLayout from "@/layouts/MainLayout";
import ChecklistGroupPage from "@/components/checklist/ChecklistGroupPage";
import { useRouter } from "next/router";

const GROUP_MAP = {
  group1: { no: 1, key: "strategy",  title: "Checklist หมวด 1: กลยุทธ์องค์กร" },
  group2: { no: 2, key: "structure", title: "Checklist หมวด 2: โครงสร้างองค์กร" },
  group3: { no: 3, key: "sop",       title: "Checklist หมวด 3: คู่มือปฏิบัติงาน" },
  group4: { no: 4, key: "hr",        title: "Checklist หมวด 4: ระบบบุคคล & HR" },
  group5: { no: 5, key: "finance",   title: "Checklist หมวด 5: ระบบการเงิน" },
  group6: { no: 6, key: "sales",     title: "Checklist หมวด 6: ระบบลูกค้า / ขาย" },
} as const;

type GKey = keyof typeof GROUP_MAP;

function GroupRoutePageImpl() {
  const { query } = useRouter();
  const g = String(query.group || "");
  if (!(g in GROUP_MAP)) return null;
  const cfg = GROUP_MAP[g as GKey];

  return (
    <MainLayout>
      <ChecklistGroupPage
        groupNo={cfg.no}
        categoryKey={cfg.key as any}
        title={cfg.title}
        breadcrumb={`Checklist › หมวด ${cfg.no}`}
        requireEvidence={false}      // MVP: ติ๊กก็นับ (ค่อยสลับเป็น true ได้)
        storageBucket="evidence"
      />
    </MainLayout>
  );
}

export default dynamic(() => Promise.resolve(GroupRoutePageImpl), { ssr: false });
