// src/pages/checklist/[group].tsx
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/components/layouts/MainLayout";
import ChecklistGroupPage from "@/components/checklist/ChecklistGroupPage";
import type { CategoryKey } from "@/services/checklistService";
import { listYears } from "@/services/checklistService";
import { getLastYear, setLastYear } from "@/utils/yearPref";

/**
 * รองรับทั้ง slug แบบใหม่ (strategy|structure|sop|hr|finance|sales)
 * และแบบเดิม (group1..group6) เพื่อความเข้ากันได้ย้อนหลัง
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

const LEGACY_MAP: Record<`group${1|2|3|4|5|6}`, CategoryKey> = {
  group1: "strategy",
  group2: "structure",
  group3: "sop",
  group4: "hr",
  group5: "finance",
  group6: "sales",
};

function resolveCategoryKey(param: string | string[] | undefined): CategoryKey | null {
  const raw = String(param ?? "").trim().toLowerCase();
  if (!raw) return null;
  if ((SLUG_MAP as any)[raw]) return raw as CategoryKey;
  if ((LEGACY_MAP as any)[raw]) return LEGACY_MAP[raw as keyof typeof LEGACY_MAP];
  return null;
}

function GroupRoutePageImpl() {
  const router = useRouter();

  // แปลง slug -> categoryKey
  const catKey = resolveCategoryKey(router.query.group);

  /**
   * เติม year ลงใน query ถ้ายังไม่มี:
   * 1) ใช้ lastYear จาก localStorage
   * 2) ถ้าไม่มีก็ถามจากฐานข้อมูล (ปีล่าสุดที่มีข้อมูล)
   * 3) ถ้ายังไม่ได้ก็ปีปัจจุบัน
   *
   * ใช้ router.replace(..., { shallow:true, scroll:false }) เพื่อไม่รีเรนเดอร์ layout ทั้งหน้า
   * ลดโอกาสเกิดช่องว่าง/กระพริบตอนนำทางมาจาก Dashboard
   */
  useEffect(() => {
    if (!catKey) return;

    const qYear = Number(router.query.year);
    if (Number.isFinite(qYear) && qYear > 0) {
      setLastYear(qYear);
      return;
    }

    (async () => {
      let y = getLastYear();
      if (!y) {
        try {
          const ys = await listYears();
          y = [...ys].sort((a, b) => b - a)[0] ?? new Date().getFullYear();
        } catch {
          y = new Date().getFullYear();
        }
      }
      setLastYear(y);

      // เติม year ลงไปแบบ shallow เพื่อคง layout/state ที่มีอยู่
      router.replace(
        { pathname: router.pathname, query: { ...router.query, year: y } },
        undefined,
        { shallow: true, scroll: false }
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catKey]);

  // slug ไม่ถูกต้อง -> เด้งกลับหน้า overview
  if (!catKey) {
    if (typeof window !== "undefined") {
      // เก็บปีไว้ให้หน้าถัดไปใช้
      const y = getLastYear() || new Date().getFullYear();
      window.location.replace(`/checklist?year=${y}`);
    }
    return null;
  }

  const cfg = SLUG_MAP[catKey];

  // นโยบายคะแนน: ต้องมี evidence จึงนับ (ให้ภาพรวม/แดชบอร์ดสอดคล้องกัน)
  const requireEvidence = true;

  return (
    // ❗️ไม่ห่ออะไรเพิ่ม เพื่อไม่เพิ่มระยะขาว — ให้ ChecklistGroupPage จัดการ spacing เอง
    <ChecklistGroupPage
      key={`${cfg.key}-${router.query.year ?? "ny"}`} // force remount เมื่อเปลี่ยนปี/หมวด ลดอาการขนาดเพี้ยน
      groupNo={cfg.no}
      categoryKey={cfg.key}
      title={cfg.title}
      breadcrumb={`Checklist › หมวด ${cfg.no}`}
      requireEvidence={requireEvidence}
      storageBucket="evidence"
      // หมายเหตุ: ปีจะถูกเติมเข้ามาใน query แล้วจาก useEffect ด้านบน
    />
  );
}

// ใช้ MainLayout แบบเดียวกับการเข้าโดยคลิกจาก Sidebar
// เพื่อคง UI/spacing ให้เหมือนกันทุกวิธีการนำทาง
(GroupRoutePageImpl as any).getLayout = (page: React.ReactElement) => (
  <MainLayout>{page}</MainLayout>
);

// ปิด SSR (ใช้ข้อมูลฝั่ง client + ป้องกันระยะกระโดดระหว่าง hydrate)
export default dynamic(() => Promise.resolve(GroupRoutePageImpl), { ssr: false });
