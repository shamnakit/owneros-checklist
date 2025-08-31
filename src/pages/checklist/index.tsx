// /src/pages/checklist/index.tsx
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/utils/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Smile,
  Trophy,
  Target,
  Building2,
  BookText,
  Users,
  Wallet,
  ShoppingCart,
} from "lucide-react";

type CategoryKey = "strategy" | "structure" | "sop" | "hr" | "finance" | "sales";
type CatRow = {
  category: string;
  score: number;
  max_score_category: number;
  evidence_rate_pct: number; // 0–100
};
type TotalRow = {
  total_score: number;
  max_score: number;
  tier_label: "Excellent" | "Developing" | "Early Stage";
};

const MAIN_CAT_KEYS: CategoryKey[] = [
  "strategy",
  "structure",
  "sop",
  "hr",
  "finance",
  "sales",
];

const CAT_LABEL: Record<CategoryKey, string> = {
  strategy: "กลยุทธ์องค์กร",
  structure: "โครงสร้างองค์กร",
  sop: "คู่มือปฏิบัติงาน",
  hr: "ระบบบุคคล & HR",
  finance: "ระบบการเงิน",
  sales: "ระบบลูกค้า / ขาย",
};

const CAT_ICON: Record<CategoryKey, React.ComponentType<any>> = {
  strategy: Target,
  structure: Building2,
  sop: BookText,
  hr: Users,
  finance: Wallet,
  sales: ShoppingCart,
};

const CAT_ROUTE: Record<CategoryKey, string> = {
  strategy: "/checklist/group1",
  structure: "/checklist/group2",
  sop: "/checklist/group3",
  hr: "/checklist/group4",
  finance: "/checklist/group5",
  sales: "/checklist/group6",
};

const CAT_COLORS: Record<CategoryKey, string> = {
  strategy: "#3B82F6",
  structure: "#10B981",
  sop: "#8B5CF6",
  hr: "#F59E0B",
  finance: "#EAB308",
  sales: "#EC4899",
};

function pct(n: number) {
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}%`;
}
function encouragement(p: number) {
  if (p >= 90) return "สุดยอด! เข้าเส้นชัยแล้ว 🎉";
  if (p >= 75) return "ใกล้ครบแล้ว! สู้ต่ออีกนิด 👍";
  if (p >= 50) return "มาได้ครึ่งทางแล้ว ดีมาก!";
  if (p > 0) return "เริ่มต้นได้สวย 👏";
  return "เริ่มจากข้อนี้ก่อนก็ได้ครับ 🙂";
}
function tierThai(t: TotalRow["tier_label"]) {
  if (t === "Excellent") return "Excellent";
  if (t === "Developing") return "Developing";
  return "Early Stage";
}

function ChecklistOverviewImpl() {
  const { uid } = useUserProfile();

  // ปีที่มีข้อมูล
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(thisYear);

  // รวม & รายหมวด
  const [total, setTotal] = useState<TotalRow | null>(null);
  const [cats, setCats] = useState<Record<CategoryKey, CatRow | null>>({
    strategy: null,
    structure: null,
    sop: null,
    hr: null,
    finance: null,
    sales: null,
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // โหลดปีที่มีจริง (RPC)
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.rpc("fn_available_years_for_me");
      if (!mounted) return;
      if (error) {
        setErr(error.message);
        return;
      }
      const years = (data || [])
        .map((r: any) => Number(r.year_version))
        .filter(Boolean);
      setAvailableYears(years.length ? years : [thisYear]);
      if (years.length) setYear((y) => (years.includes(y) ? y : years[0]));
    })();
    return () => {
      mounted = false;
    };
  }, [uid]);

  // โหลดคะแนนรวม + รายหมวด (RPC) — เปิด require_evidence=true
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [{ data: tot, error: e1 }, { data: catRows, error: e2 }] =
          await Promise.all([
            supabase.rpc("fn_score_total_for_me", {
              p_year: year,
              p_require_evidence: true,
            }),
            supabase.rpc("fn_score_by_category_for_me", {
              p_year: year,
              p_require_evidence: true,
            }),
          ]);
        if (e1) throw e1;
        if (e2) throw e2;
        if (!mounted) return;

        setTotal((tot as TotalRow[] | null)?.[0] ?? null);

        const byCat: Record<CategoryKey, CatRow | null> = {
          strategy: null,
          structure: null,
          sop: null,
          hr: null,
          finance: null,
          sales: null,
        };
        (catRows as CatRow[] | null)?.forEach((r) => {
          const key = String(r.category).trim().toLowerCase() as CategoryKey;
          if (MAIN_CAT_KEYS.includes(key)) byCat[key] = r;
        });
        setCats(byCat);
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [uid, year]);

  // % รวมทั้งระบบ (จากคะแนน)
  const overallPct = useMemo(() => {
    if (!total) return 0;
    const p =
      (Number(total.total_score) / Math.max(1, Number(total.max_score))) * 100;
    return Math.max(0, Math.min(100, Math.round(p)));
  }, [total]);

  return (
    <div className="p-6 grid gap-6">
      {/* Hero */}
      <Card className="shadow-sm">
        <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 text-blue-700 p-3">
              <Smile size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                คุณกำลังสร้างระบบองค์กรไปอีกขั้น 👍
              </h1>
              <p className="text-gray-600 mt-1">
                เลือกปีด้านขวา แล้วไปเก็บแต้มในหมวดที่ยังขาด—ผมเป็น “รุ่นพี่ที่คอยช่วยเชียร์”
                ให้คุณไปถึง Tier ที่ดีกว่าเสมอ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border rounded-md px-2 py-2"
              aria-label="เลือกปี"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  ปี {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Overall (Score%) */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-700">
              <Trophy size={18} className="text-yellow-600" />
              <span className="font-medium">ความคืบหน้าโดยรวม (ปี {year})</span>
            </div>
            <span className="text-gray-600">
              {pct(overallPct)} • {total ? tierThai(total.tier_label) : "-"}
            </span>
          </div>
          <div className="w-full bg-gray-200/70 h-3 rounded-full overflow-hidden">
            <div
              className="h-3 rounded-full transition-all"
              style={{
                width: `${overallPct}%`,
                background: "linear-gradient(90deg,#34d399,#22c55e)",
              }}
            />
          </div>
        </div>
      </Card>

      {/* Error/Loading */}
      {err && (
        <Card className="border-red-300">
          <div className="p-4 text-red-700">เกิดข้อผิดพลาด: {err}</div>
        </Card>
      )}
      {loading && (
        <Card>
          <div className="p-4">กำลังโหลดข้อมูล…</div>
        </Card>
      )}

      {/* 6 Category Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {MAIN_CAT_KEYS.map((cat) => {
            const row = cats[cat]; // ✅ ใช้ state เดิม
            const max = Number(row?.max_score_category ?? 0);

            // Score% จากคะแนน / max
            const scorePct =
              max > 0 ? Math.round((Number(row!.score) / max) * 100) : 0;

            // Progress% = evidence_rate_pct (ถือว่าเสร็จเมื่อมีหลักฐาน ≥1)
            const progressPct = Math.max(
              0,
              Math.min(100, Math.round(Number(row?.evidence_rate_pct ?? 0)))
            );

            const Icon = CAT_ICON[cat];
            const color = CAT_COLORS[cat];

            const donutData = [
              { name: "done", value: scorePct },
              { name: "remain", value: Math.max(0, 100 - scorePct) },
            ];

            // Badge ผ่านขั้นต่ำ (หมวด): Score≥60 และ Progress≥70
            const passed = scorePct >= 60 && progressPct >= 70;

            return (
              <Card key={cat} className="shadow-sm">
                <div className="p-5 flex items-start gap-4">
                  <div
                    className="rounded-xl p-2"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{CAT_LABEL[cat]}</h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            passed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {passed ? "ผ่านขั้นต่ำ" : "ยังไม่ผ่าน"}
                        </span>
                        <span className="text-sm text-gray-500">
                          {row
                            ? `${Number(row.score)}/${Number(
                                row.max_score_category
                              )}`
                            : "-"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4">
                      {/* Score% (Donut) */}
                      <div className="w-28 h-28">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip formatter={(v: any) => `${v}%`} />
                            <Pie
                              data={donutData}
                              dataKey="value"
                              innerRadius={40}
                              outerRadius={55}
                              stroke="none"
                              startAngle={90}
                              endAngle={-270}
                            >
                              <Cell fill={color} />
                              <Cell fill="#e5e7eb" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Labels + Progress bar */}
                      <div className="flex-1">
                        <div className="text-3xl font-bold">
                          {pct(scorePct)}
                        </div>
                        <div className="text-gray-600">
                          {encouragement(scorePct)}
                        </div>

                        <div className="mt-2 text-xs text-gray-600">
                          Progress: {pct(progressPct)}
                        </div>
                        <div className="w-full bg-gray-200/70 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${progressPct}%`,
                              background:
                                "linear-gradient(90deg,#60a5fa,#34d399)",
                            }}
                          />
                        </div>

                        {row && progressPct < 100 && (
                          <div className="text-xs text-amber-700 mt-1">
                            หลักฐานครบ {Math.round(
                              Number(row.evidence_rate_pct)
                            )}
                            % — เก็บเพิ่มเพื่อปลดล็อกคะแนนเต็ม
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link href={CAT_ROUTE[cat]}>
                        <Button className="bg-blue-600 hover:bg-blue-500">
                          ไปเก็บคะแนนต่อ
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(ChecklistOverviewImpl), {
  ssr: false,
});
