// src/components/ChecklistDashboard.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CategoryKey, ChecklistItem } from "@/services/checklistService";
import { loadItems, calcSummary, listYears } from "@/services/checklistService";
import { getLastYear, setLastYear } from "@/utils/yearPref";

/** สีประจำหมวด (เข้าธีม muted) */
const ACCENT: Record<CategoryKey, string> = {
  strategy: "#FFD54A",
  structure: "#2DD4BF",
  sop: "#9D7CFF",
  hr: "#22C55E",
  finance: "#F6C453",
  sales: "#FF7A1A",
};

const GROUPS: { key: CategoryKey; title: string; slug: CategoryKey }[] = [
  { key: "strategy",  title: "กลยุทธ์องค์กร",        slug: "strategy"  },
  { key: "structure", title: "โครงสร้างองค์กร",      slug: "structure" },
  { key: "sop",       title: "คู่มือปฏิบัติงาน",      slug: "sop"       },
  { key: "hr",        title: "ระบบบุคคล & HR",        slug: "hr"        },
  { key: "finance",   title: "ระบบการเงิน",           slug: "finance"   },
  { key: "sales",     title: "ระบบลูกค้า / ขาย",      slug: "sales"     },
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
  // ===== Years =====
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [yearLoading, setYearLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ys = await listYears();
        if (!mounted) return;
        const sorted = [...ys].sort((a, b) => b - a);
        const last = getLastYear();
        const initial = last && sorted.includes(last) ? last : sorted[0] ?? new Date().getFullYear();
        setYears(sorted);
        setYear(initial);
        setLastYear(initial);
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
    strategy: [], structure: [], sop: [], hr: [], finance: [], sales: [],
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const results = await Promise.all(GROUPS.map((g) => loadItems({ year, category: g.key })));
        if (!mounted) return;
        const next: Record<CategoryKey, ChecklistItem[]> = {
          strategy: [], structure: [], sop: [], hr: [], finance: [], sales: [],
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
        key: g.key, title: g.title, pct: s.pct, total: s.total, scored: s.scored,
        completed: s.completed, checkedNoFile: s.checkedNoFile, notStarted: s.notStarted, withFile: s.withFile,
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
    setLastYear(n);
  };

  return (
    <main className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-1)]">Checklist ระบบองค์กร</h2>
          <p className="muted mt-1">ภาพรวมสถานะ 6 หมวด (นับเฉพาะข้อที่มีหลักฐานแนบ)</p>
        </div>

        <div className="flex items-center gap-4">
          {/* ความครบถ้วนรวม */}
          <div className="panel-dark px-4 py-3">
            <div className="muted text-xs">ความครบถ้วนรวม</div>
            <div className="text-right text-3xl font-extrabold tracking-tight text-[var(--text-1)]">
              {avgPct}%
            </div>
          </div>

          {/* Year Switcher */}
          <div className="panel-dark px-3 py-2">
            {yearLoading ? (
              <div className="text-sm muted">กำลังโหลดปี…</div>
            ) : (
              <select
                value={year}
                onChange={(e) => handleChangeYear(Number(e.target.value))}
                className="input-dark text-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>ปี {y}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="panel-dark p-10 text-center muted">กำลังโหลดข้อมูล…</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groupProgress.map((g) => {
            const href = { pathname: `/checklist/${g.key}`, query: { year } };
            const accent = ACCENT[g.key];
            return (
              <div key={g.key} className="panel-dark p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-1)]">{g.title}</h3>
                    <div className="mt-1 text-sm muted">
                      คะแนน:{" "}
                      <span className="font-semibold text-[var(--text-1)]">
                        {g.scored.toLocaleString()}
                      </span>{" "}
                      / {g.total.toLocaleString()}
                    </div>
                  </div>
                  {/* ตัวเลขเปอร์เซ็นต์ — หนา/เนียนตามธีม + สีรายหมวด */}
                  <div
                    className="text-3xl font-extrabold tracking-tight"
                    style={{ color: accent, textShadow: "0 1px 0 rgba(0,0,0,.35)" }}
                  >
                    {g.pct}%
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 progress-track h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, g.pct))}%`,
                      background: `linear-gradient(90deg, ${accent} 0%, ${accent}80 60%, #FFFFFFAA 130%)`,
                      boxShadow: `0 0 18px ${accent}40`,
                    }}
                  />
                </div>

                {/* Stats */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="panel-dark p-2">
                    <div className="muted">เสร็จ + มีไฟล์</div>
                    <div className="mt-1 font-semibold text-[var(--text-1)]">
                      {g.completed.toLocaleString()}
                    </div>
                  </div>
                  <div className="panel-dark p-2">
                    <div className="muted">ติ๊กแต่ไม่มีไฟล์</div>
                    <div className="mt-1 font-semibold text-[var(--text-1)]">
                      {g.checkedNoFile.toLocaleString()}
                    </div>
                  </div>
                  <div className="panel-dark p-2">
                    <div className="muted">ยังไม่เริ่ม</div>
                    <div className="mt-1 font-semibold text-[var(--text-1)]">
                      {g.notStarted.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-5">
                  <Link
                    href={href}
                    className="btn-primary inline-flex items-center justify-center"
                    style={{ boxShadow: `0 0 18px ${accent}40` }}
                  >
                    เข้าดู Checklist
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GAP & ACTION Panel */}
      <section className="mt-8 panel-dark p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="panel-title">GAP & ACTION</h3>
          <Link href="/actions" className="btn-outline">ดูรายการทั้งหมด</Link>
        </div>
        <p className="panel-note mt-2">
          สรุปจุดอ่อนสำคัญและแผนดำเนินการเร็ว — โฟกัส “ติ๊กแล้วแต่ยังไม่มีไฟล์” และ “ยังไม่เริ่ม” ในหมวดที่คะแนนต่ำ
        </p>
      </section>
    </main>
  );
}
