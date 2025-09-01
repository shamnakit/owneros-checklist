// src/hooks/useChecklist.ts
import { useEffect, useMemo, useState } from "react";
import type { CategoryKey, ChecklistItem } from "@/services/checklistService";
import {
  listYears,
  loadItems,
  calcSummary,
} from "@/services/checklistService";

// ใช้ชื่อหมวดแบบ slug
export const GROUPS: CategoryKey[] = [
  "strategy",
  "structure",
  "sop",
  "hr",
  "finance",
  "sales",
];

/** ดึงปีล่าสุดจากระบบ (fallback = ปีปัจจุบัน) */
export function useLatestYear() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ys = await listYears();
        if (!mounted) return;
        setYear(ys.sort((a, b) => b - a)[0] ?? new Date().getFullYear());
      } catch {
        // เงียบไว้และใช้ปีปัจจุบัน
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { year, setYear, loading };
}

/** Overview: โหลดทุกหมวด แล้วสรุป %/คะแนน ต่อหมวด + คำนวณค่าเฉลี่ยรวม */
export function useChecklistOverview(year: number) {
  const [loading, setLoading] = useState(true);
  const [rowsByGroup, setRowsByGroup] = useState<
    Record<CategoryKey, ChecklistItem[]>
  >({
    strategy: [],
    structure: [],
    sop: [],
    hr: [],
    finance: [],
    sales: [],
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const results = await Promise.all(
          GROUPS.map((g) => loadItems({ year, category: g }))
        );
        if (!mounted) return;
        const next: Record<CategoryKey, ChecklistItem[]> = {
          strategy: [],
          structure: [],
          sop: [],
          hr: [],
          finance: [],
          sales: [],
        };
        GROUPS.forEach((g, i) => (next[g] = results[i] ?? []));
        setRowsByGroup(next);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [year]);

  const perGroup = useMemo(
    () =>
      GROUPS.map((g) => {
        const items = rowsByGroup[g] || [];
        const s = calcSummary(items, true); // นับเฉพาะที่มี evidence
        return { key: g, summary: s };
      }),
    [rowsByGroup]
  );

  const totalPercent = useMemo(() => {
    if (!perGroup.length) return 0;
    const sum = perGroup.reduce((acc, x) => acc + (x.summary.pct || 0), 0);
    return Math.round(sum / perGroup.length);
  }, [perGroup]);

  return { loading, perGroup, totalPercent };
}

/** Group page: โหลดรายการของหมวดเดียว + %ความครบถ้วนของหมวด */
export function useChecklistGroup(group: CategoryKey, year: number) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const it = await loadItems({ year, category: group });
        if (!mounted) return;
        setItems(it);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [group, year]);

  const percent = useMemo(() => calcSummary(items, true).pct, [items]);

  return { items, setItems, percent, loading };
}
