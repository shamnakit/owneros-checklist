// src/components/ChecklistDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { CategoryKey, ChecklistItem } from "@/services/checklistService";
import { loadItems, calcSummary, listYears } from "@/services/checklistService";
import { getLastYear, setLastYear } from "@/utils/yearPref";

const GROUPS: { key: CategoryKey; title: string; slug: CategoryKey }[] = [
  { key: "strategy", title: "กลยุทธ์องค์กร", slug: "strategy" },
  { key: "structure", title: "โครงสร้างองค์กร", slug: "structure" },
  { key: "sop", title: "คู่มือปฏิบัติงาน", slug: "sop" },
  { key: "hr", title: "ระบบบุคคล & HR", slug: "hr" },
  { key: "finance", title: "ระบบการเงิน", slug: "finance" },
  { key: "sales", title: "ระบบลูกค้า / ขาย", slug: "sales" },
];

type GroupProgress = {
  key: CategoryKey;
  title: string;
  pct: number;
  total: number;
  scored: number;
  completed: number;
  checkedNoFile: number;
  notStarted: number;
  withFile: number;
};

export default function ChecklistDashboard() {
  const router = useRouter();

  // ===== Years =====
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [yearLoading, setYearLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ys = await listYears(); // ปีที่มีข้อมูลในระบบ
        if (!mounted) return;
        const sorted = [...ys].sort((a, b) => b - a);
        const last = getLastYear();
        const initial = last && sorted.includes(last) ? last : sorted[0] ?? new Date().getFullYear();
        setYears(sorted);
        setYear(initial);
        setLastYear(initial); // บันทึกซ้ำไว้เป็นค่าเริ่มต้น
      } catch {
        const now = new Date().getFullYear();
        setYears([now]);
        setYear(now);
        setLastYear(now);
      } finally {
        if (mounted) setYearLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ===== Load each group =====
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Record<CategoryKey, ChecklistItem[]>>({
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
          GROUPS.map((g) => loadItems({ year, category: g.key }))
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
        GROUPS.forEach((g, i) => (next[g.key] = results[i] ?? []));
        setRows(next);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [year]);

  // ===== Summaries =====
  const groupProgress: GroupProgress[] = useMemo(() => {
    return GROUPS.map((g) => {
      const items = rows[g.key] || [];
      const s = calcSummary(items, true); // requireEvidence = true
      return {
        key: g.key,
        title: g.title,
        pct: s.pct,
        total: s.total,
        scored: s.scored,
        completed: s.completed,
        checkedNoFile: s.checkedNoFile,
        notStarted: s.notStarted,
        withFile: s.withFile,
      };
    });
  }, [rows]);

  const avgPct = useMemo(() => {
    if (!groupProgress.length) return 0;
    const sum = groupProgress.reduce((acc, g) => acc + (g.pct || 0), 0);
    return Math.round(sum / groupProgress.length);
  }, [groupProgress]);

  const handleChangeYear = (n: number) => {
    setYear(n);
    setLastYear(n); // จำไว้ให้หน้า Group ใช้ต่อ
  };

  return (
    <main className="flex-1 bg-slate-50 p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Checklist ระบบองค์กร</h2>
          <p className="text-slate-500 mt-1">ภาพรวมสถานะ 6 หมวด (นับเฉพาะข้อที่มีหลักฐานแนบ)</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500">ความครบถ้วนรวม</div>
            <div className="text-2xl font-bold text-emerald-600">{avgPct}%</div>
          </div>

          {/* Year Switcher แบบง่ายใน Dashboard เท่านั้น */}
          <div className="rounded-xl bg-white px-3 py-2 shadow-sm border border-slate-200">
            {yearLoading ? (
              <div className="text-sm text-slate-500">กำลังโหลดปี…</div>
            ) : (
              <select
                value={year}
                onChange={(e) => handleChangeYear(Number(e.target.value))}
                className="text-sm outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    ปี {y}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          กำลังโหลดข้อมูล…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groupProgress.map((g) => {
            // ไม่ต้องส่ง year ในลิงก์ — หน้า Group จะไปดึงจาก localStorage เอง
            const href = `/checklist/${g.key}`;
            return (
              <div key={g.key} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{g.title}</h3>
                    <div className="mt-1 text-sm text-slate-500">
                      คะแนน: {g.scored.toLocaleString()} / {g.total.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">{g.pct}%</div>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, g.pct))}%` }}
                  />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="font-medium text-slate-700">เสร็จ + มีไฟล์</div>
                    <div className="mt-1">{g.completed.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="font-medium text-slate-700">ติ๊กแต่ไม่มีไฟล์</div>
                    <div className="mt-1">{g.checkedNoFile.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="font-medium text-slate-700">ยังไม่เริ่ม</div>
                    <div className="mt-1">{g.notStarted.toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-5">
                  <Link href={href} className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                    เข้าดู Checklist
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
