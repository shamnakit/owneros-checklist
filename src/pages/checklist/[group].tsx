// src/pages/checklist/[group].tsx
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import MainLayout from "@/components/layouts/MainLayout";
import ChecklistGroupPage from "@/components/checklist/ChecklistGroupPage";
import type { CategoryKey } from "@/services/checklistService";

/**
 * รองรับทั้ง slug แบบใหม่ (strategy|structure|sop|hr|finance|sales)
 * และแบบเดิม (group1..group6) แบบ backward-compatible
 */

const SLUG_MAP: Record<
  CategoryKey,
  { no: 1 | 2 | 3 | 4 | 5 | 6; key: CategoryKey; title: string }
> = {
  strategy: { no: 1, key: "strategy", title: "Checklist หมวด 1: กลยุทธ์และทิศทางองค์กร" },
  structure: { no: 2, key: "structure", title: "Checklist หมวด 2: โครงสร้างและการกำกับดูแล" },
  sop:       { no: 3, key: "sop",       title: "Checklist หมวด 3: กระบวนการและคู่มือการทำงาน" },
  hr:        { no: 4, key: "hr",        title: "Checklist หมวด 4: บุคลากรและการพัฒนา HR" },
  finance:   { no: 5, key: "finance",   title: "Checklist หมวด 5: การเงินและการวัดผล" },
  sales:     { no: 6, key: "sales",     title: "Checklist หมวด 6: ลูกค้าและการตลาด/การขาย" },
};

const LEGACY_MAP: Record<
  `group${1 | 2 | 3 | 4 | 5 | 6}`,
  CategoryKey
> = {
  group1: "strategy",
  group2: "structure",
  group3: "sop",
  group4: "hr",
  group5: "finance",
  group6: "sales",
};

function resolveCategoryKey(param: string | string[] | undefined): CategoryKey | null {
  const raw = String(param ?? "").toLowerCase();
  if (!raw) return null;
  if (raw in SLUG_MAP) return raw as CategoryKey;
  if (raw in LEGACY_MAP) return LEGACY_MAP[raw as keyof typeof LEGACY_MAP];
  return null;
}

function GroupRoutePageImpl() {
  const router = useRouter();
  const catKey = resolveCategoryKey(router.query.group);

  // อ่านปีจาก query (เผื่อใช้ต่อใน child ผ่าน useRouter)
  const year = Number(router.query.year ?? new Date().getFullYear());

  if (!catKey) {
    // ถ้า slug ไม่ถูกต้องให้เด้งกลับหน้า overview
    if (typeof window !== "undefined") {
      const search = new URLSearchParams();
      if (!Number.isNaN(year)) search.set("year", String(year));
      const qs = search.toString();
      window.location.replace(`/checklist${qs ? `?${qs}` : ""}`);
    }
    return null;
  }

  const cfg = SLUG_MAP[catKey];

  // นโยบาย %ความครบถ้วน: ต้องมีไฟล์แนบด้วยจึงนับคะแนน → requireEvidence=true
  const requireEvidence = true;

  return (
    <ChecklistGroupPage
      groupNo={cfg.no}
      categoryKey={cfg.key}
      title={cfg.title}
      breadcrumb={`Checklist › หมวด ${cfg.no}`}
      requireEvidence={requireEvidence}
      storageBucket="evidence"
      // หมายเหตุ: ปีอ่านจาก useRouter ภายใน ChecklistGroupPage ได้อยู่แล้วผ่าน query ?year=
    />
  );
}

// ใส่ MainLayout ระดับเพจ (Pages Router)
(GroupRoutePageImpl as any).getLayout = (page: React.ReactElement) => (
  <MainLayout>{page}</MainLayout>
);

// ปิด SSR เพื่อหลีกเลี่ยงปัญหา Supabase client-side
export default dynamic(() => Promise.resolve(GroupRoutePageImpl), { ssr: false });
