// src/pages/dashboard.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/utils/supabaseClient";
import {
  AlertTriangle, CheckCircle2, FileWarning, UploadCloud, Target, ArrowRight,
  ListChecks, FileCheck2, RefreshCw, Building2, Calendar, TrendingUp
} from "lucide-react";
import Link from "next/link";

/** ---------- Types ---------- */
type UUID = string;
type ChecklistRow = {
  id: UUID;
  template_id: UUID;
  group_name: string;
  name: string;
  input_text: string | null;
  file_path: string | null;
  file_key: string | null;
  updated_at: string | null;
  year_version: number;
  user_id: UUID;
};
type GroupKey =
  | "กลยุทธ์องค์กร"
  | "โครงสร้างองค์กร"
  | "คู่มือปฏิบัติงาน"
  | "ระบบบุคคล & HR"
  | "ระบบการเงิน"
  | "ระบบลูกค้า / ขาย";

const GROUP_ORDER: GroupKey[] = [
  "กลยุทธ์องค์กร",
  "โครงสร้างองค์กร",
  "คู่มือปฏิบัติงาน",
  "ระบบบุคคล & HR",
  "ระบบการเงิน",
  "ระบบลูกค้า / ขาย",
];

/** ---------- Small helpers ---------- */
const isStale = (iso?: string | null, days = 180) => {
  if (!iso) return false;
  const d = new Date(iso).getTime();
  return Date.now() - d > days * 24 * 3600 * 1000;
};
const pct = (n: number, d: number) => (d <= 0 ? 0 : Math.round((n / d) * 100));

/** ---------- Dashboard Page ---------- */
export default function DashboardPage() {
  const { uid, profile } = useUserProfile();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [rows, setRows] = useState<ChecklistRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2000);
  };

  // load checklists of current year
  useEffect(() => {
    if (!uid) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("checklists_v2")
          .select(
            "id,template_id,group_name,name,input_text,file_path,file_key,updated_at,year_version,user_id"
          )
          .eq("user_id", uid)
          .eq("year_version", year);
        if (error) throw error;
        if (active) setRows((data ?? []) as ChecklistRow[]);
      } catch (e) {
        console.error(e);
        showToast("โหลดข้อมูลไม่สำเร็จ", "error");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [uid, year]);

  /** ---------- Derived stats ---------- */
  type GroupStats = {
    key: GroupKey;
    total: number;
    withFile: number;
    textOnly: number;
    pending: number;
    stale: number;
    percent: number;
    link: string; // /checklist/groupN
  };

  const groupStats: GroupStats[] = useMemo(() => {
    const map = new Map<GroupKey, ChecklistRow[]>();
    GROUP_ORDER.forEach((g) => map.set(g, []));
    rows.forEach((r) => {
      const k = (r.group_name as GroupKey) || "กลยุทธ์องค์กร";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    });

    const linkOf = (k: GroupKey) => {
      const idx = GROUP_ORDER.indexOf(k);
      return `/checklist/group${idx + 1}`;
    };

    const stats: GroupStats[] = [];
    for (const g of GROUP_ORDER) {
      const list = map.get(g) ?? [];
      const total = list.length;
      const withFile = list.filter((x) => !!x.file_key).length;
      const textOnly = list.filter((x) => !x.file_key && (x.input_text?.trim().length || 0) >= 100).length;
      const pending = Math.max(0, total - withFile - textOnly);
      const stale = list.filter((x) => !!x.file_key && isStale(x.updated_at, 180)).length;
      stats.push({
        key: g,
        total,
        withFile,
        textOnly,
        pending,
        stale,
        percent: pct(withFile + textOnly, total),
        link: linkOf(g),
      });
    }
    return stats;
  }, [rows]);

  const overall = useMemo(() => {
    const total = groupStats.reduce((s, g) => s + g.total, 0);
    const withFile = groupStats.reduce((s, g) => s + g.withFile, 0);
    const textOnly = groupStats.reduce((s, g) => s + g.textOnly, 0);
    const pending = groupStats.reduce((s, g) => s + g.pending, 0);
    const stale = groupStats.reduce((s, g) => s + g.stale, 0);
    return {
      total,
      withFile,
      textOnly,
      pending,
      stale,
      percent: pct(withFile + textOnly, total),
      tier: tierFromPercent(pct(withFile + textOnly, total)),
    };
  }, [groupStats]);

  /** ---------- Rule-based Action Suggestions ---------- */
  type Action = {
    id: string;
    title: string;
    desc?: string;
    icon?: ReactNode; // ✅ ใช้ ReactNode แทน JSX.Element
    href?: string;
    kind: "evidence" | "text" | "stale" | "quickwin";
    score: number; // priority (สูงก่อน)
    cta?: string;
  };

  const actions: Action[] = useMemo(() => {
    const list: Action[] = [];

    // 1) ยังไม่ได้ทำจำนวนมาก
    const pendings = groupStats.filter((g) => g.pending > 0);
    for (const g of pendings) {
      if (g.pending === 0) continue;
      list.push({
        id: `pending-${g.key}`,
        kind: "text",
        title: `ยังไม่ได้ทำ ${g.pending} รายการในหมวด “${g.key}”`,
        desc: `กดเข้าไปติ๊กและใส่คำอธิบายอย่างน้อย 100 ตัวอักษร`,
        icon: <ListChecks className="w-4 h-4" />,
        href: g.link,
        cta: "ไปทำรายการ",
        score: 80 + Math.min(10, g.pending),
      });
    }

    // 2) ติ๊กแล้วแต่ยังไม่มีไฟล์ (แนะนำแนบหลักฐาน)
    const noEvidence = groupStats.filter((g) => g.textOnly > 0);
    for (const g of noEvidence) {
      list.push({
        id: `textonly-${g.key}`,
        kind: "evidence",
        title: `ยังไม่มีไฟล์หลักฐาน ${g.textOnly} รายการในหมวด “${g.key}”`,
        desc: `แนบเอกสาร PDF/Doc/รูป เพื่อพร้อม Audit ทันที`,
        icon: <UploadCloud className="w-4 h-4" />,
        href: g.link,
        cta: "แนบหลักฐาน",
        score: 90 + Math.min(10, g.textOnly),
      });
    }

    // 3) หลักฐานเก่ามาก > 180 วัน
    const stale = groupStats.filter((g) => g.stale > 0);
    for (const g of stale) {
      list.push({
        id: `stale-${g.key}`,
        kind: "stale",
        title: `ไฟล์หลักฐานเก่าเกิน 180 วัน ${g.stale} รายการใน “${g.key}”`,
        desc: "อัปเดตไฟล์ล่าสุดเพื่อความน่าเชื่อถือ",
        icon: <RefreshCw className="w-4 h-4" />,
        href: g.link,
        cta: "อัปเดตไฟล์",
        score: 70 + Math.min(10, g.stale),
      });
    }

    // 4) Quick win ถ้าความคืบหน้าต่ำในบางหมวด
    const low = groupStats
      .filter((g) => g.total > 0 && g.percent < 50)
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 2);
    for (const g of low) {
      list.push({
        id: `quick-${g.key}`,
        kind: "quickwin",
        title: `เริ่มที่หมวด “${g.key}” (ความคืบหน้า ${g.percent}%)`,
        desc: "ทำสัก 2–3 รายการแรกเพื่อดันคะแนนรวมเร็วที่สุด",
        icon: <Target className="w-4 h-4" />,
        href: g.link,
        cta: "เริ่มที่หมวดนี้",
        score: 60 - g.percent, // ยิ่งต่ำยิ่งมาก
      });
    }

    // จัดลำดับความสำคัญ
    return list.sort((a, b) => b.score - a.score);
  }, [groupStats]);

  const next3 = actions.slice(0, 3);

  /** ---------- UI ---------- */
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ภาพรวมคะแนนองค์กร (OwnerOS)</h1>
          <div className="text-slate-600 text-sm mt-1">
            {profile?.company_name ? (
              <span className="inline-flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {profile.company_name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Building2 className="w-4 h-4" /> ยังไม่ตั้งชื่อบริษัท
              </span>
            )}
            <span className="mx-2">•</span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="w-4 h-4" /> ปี {year}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[year, year - 1, year - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overall KPI strip */}
      <div className="rounded-xl border bg-white p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TierBadge percent={overall.percent} />
          <div>
            <div className="text-sm text-slate-600">ความคืบหน้ารวม</div>
            <div className="text-xl font-semibold">{overall.percent}%</div>
          </div>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-5 gap-4 text-sm">
          <Kpi label="ครบพร้อมไฟล์" value={overall.withFile} />
          <Kpi label="ติ๊กแล้วแต่ยังไม่มีไฟล์" value={overall.textOnly} />
          <Kpi label="ยังไม่ทำ" value={overall.pending} />
          <Kpi label="ไฟล์เก่า > 180 วัน" value={overall.stale} />
          <div className="hidden md:flex items-center text-emerald-700 font-medium">
            <TrendingUp className="w-4 h-4 mr-2" />
            เป้าหมาย: 80%+
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">KPI Action Cards</h2>
        {loading && <div className="text-sm text-slate-500">กำลังโหลดข้อมูล…</div>}
        {!loading && actions.length === 0 && (
          <div className="rounded-xl border bg-white p-5 text-slate-600 text-sm">
            เยี่ยมมาก! ระบบของคุณพร้อมใช้งานแล้ว 🎉
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {actions.slice(0, 6).map((a) => (
            <ActionCard key={a.id} action={a} />
          ))}
        </div>
      </section>

      {/* Next 3 Actions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Next 3 Actions (ทำอันนี้ก่อน)</h2>
        <div className="space-y-2">
          {next3.map((a, i) => (
            <Link
              key={a.id}
              href={a.href || "#"}
              className="flex items-start gap-3 rounded-xl border bg-white p-4 hover:bg-slate-50"
            >
              <div className="mt-1 text-slate-500">{i + 1}.</div>
              <div className="flex-1">
                <div className="font-medium">{a.title}</div>
                {a.desc && <div className="text-sm text-slate-600 mt-0.5">{a.desc}</div>}
              </div>
              <ArrowRight className="w-4 h-4 mt-1 text-slate-400" />
            </Link>
          ))}
        </div>
      </section>

      {/* Per-group progress table */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">ความคืบหน้าตามหมวด</h2>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-4 py-3">หมวด</th>
                <th className="text-right px-4 py-3">ทั้งหมด</th>
                <th className="text-right px-4 py-3">พร้อมไฟล์</th>
                <th className="text-right px-4 py-3">ไม่มีไฟล์</th>
                <th className="text-right px-4 py-3">ยังไม่ทำ</th>
                <th className="text-right px-4 py-3">ไฟล์เก่า</th>
                <th className="text-right px-4 py-3">ความคืบหน้า</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {groupStats.map((g) => (
                <tr key={g.key} className="border-t">
                  <td className="px-4 py-3">{g.key}</td>
                  <td className="px-4 py-3 text-right">{g.total}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{g.withFile}</td>
                  <td className="px-4 py-3 text-right text-amber-700">{g.textOnly}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{g.pending}</td>
                  <td className="px-4 py-3 text-right text-rose-700">{g.stale}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-slate-700 font-medium">{g.percent}%</span>
                      <Progress value={g.percent} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={g.link} className="text-blue-600 hover:underline">
                      เปิดหมวด
                    </Link>
                  </td>
                </tr>
              ))}
              {groupStats.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white px-4 py-2 rounded-lg shadow-lg
          ${toast.type === "success" ? "bg-emerald-600" : toast.type === "error" ? "bg-rose-600" : "bg-slate-700"}`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/** ---------- UI bits ---------- */
function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
function Progress({ value }: { value: number }) {
  return (
    <div className="w-40 h-2 bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-600"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
function tierFromPercent(p: number): "Early" | "Developing" | "Excellent" {
  if (p >= 80) return "Excellent";
  if (p >= 40) return "Developing";
  return "Early";
}
function TierBadge({ percent }: { percent: number }) {
  const tier = tierFromPercent(percent);
  const color =
    tier === "Excellent"
      ? "bg-emerald-100 text-emerald-800"
      : tier === "Developing"
      ? "bg-amber-100 text-amber-800"
      : "bg-slate-100 text-slate-800";
  const Icon = tier === "Excellent" ? CheckCircle2 : tier === "Developing" ? FileCheck2 : AlertTriangle;
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${color}`}
    >
      <Icon className="w-4 h-4" />
      {tier} <span className="text-slate-500">({percent}%)</span>
    </span>
  );
}
function ActionCard({
  action,
}: {
  action: {
    id: string;
    title: string;
    desc?: string;
    href?: string;
    icon?: ReactNode; // ✅ ใช้ ReactNode
    cta?: string;
    kind: "evidence" | "text" | "stale" | "quickwin";
  };
}) {
  const tone =
    action.kind === "evidence"
      ? "border-blue-200 bg-blue-50"
      : action.kind === "text"
      ? "border-amber-200 bg-amber-50"
      : action.kind === "stale"
      ? "border-rose-200 bg-rose-50"
      : "border-slate-200 bg-slate-50";
  const iconBg =
    action.kind === "evidence"
      ? "bg-blue-500"
      : action.kind === "text"
      ? "bg-amber-500"
      : action.kind === "stale"
      ? "bg-rose-500"
      : "bg-slate-600";

  return (
    <Link
      href={action.href || "#"}
      className={`rounded-xl border p-4 hover:bg-white transition ${tone}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center ${iconBg}`}>
          {action.icon || <FileWarning className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <div className="font-medium">{action.title}</div>
          {action.desc && <div className="text-sm text-slate-600 mt-1">{action.desc}</div>}
          {action.cta && (
            <div className="text-sm text-blue-700 mt-2 inline-flex items-center gap-1">
              {action.cta} <ArrowRight className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
