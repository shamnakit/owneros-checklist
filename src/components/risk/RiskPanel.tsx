// src/components/risk/RiskPanel.tsx

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";

// อัปเดต Type ให้ใช้งานได้ง่ายขึ้น (อาจย้ายไป src/types/kpi.ts ในอนาคต)
export type KPI = {
  code: string;
  label: string;
  unit: 'THB' | 'PCT' | 'DAYS' | 'COUNT';
  value: number;
  trend?: number[];
  mom?: number | null;
  yoy?: number | null;
  status: 'green' | 'amber' | 'red';
  note?: string | null;
  score: number; // คะแนนความเสี่ยง (ใช้ในการเรียงลำดับ)
  priority: 'critical' | 'high' | 'medium' | 'low'; 
};

// ====================== Shared tiny utils ====================== 
function statusColor(s: KPI["status"]) {
  // ใช้สีจาก globals.css
  return s === "green" ? "var(--success)" : s === "amber" ? "var(--warning)" : "var(--danger)";
}

function renderValue(k: KPI) {
  const fmtMoney2 = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtPct2 = (v: number) => `${Math.max(0, Math.min(100, v)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  
  switch (k.unit) {
    case "THB":
      return `฿ ${fmtMoney2(k.value)}`;
    case "PCT":
      return fmtPct2(k.value);
    case "DAYS":
      return `${k.value.toLocaleString()} วัน`;
    default:
      return k.value.toLocaleString();
  }
}

// ====================== RiskPanel Component ======================

export function RiskPanel(props: { allRisks: KPI[] }) {
  // คำนวณจำนวน R (Red) และ A (Amber) สำหรับ Header
  const red = props.allRisks.filter((a) => a.status === "red").length;
  const amber = props.allRisks.filter((a) => a.status === "amber").length;

  // Logic การกรองความเสี่ยงที่ต้องโฟกัส (Critical/High และ ไม่ใช่ Green)
  const topFocusRisks = useMemo(() => {
    return props.allRisks
      .filter(
        // ความเสี่ยงที่ต้องโฟกัส = (สถานะ Red หรือ Amber) AND (Priority Critical หรือ High)
        (a) =>
          (a.status === "red" || a.status === "amber") &&
          (a.priority === "critical" || a.priority === "high")
      )
      .sort((a, b) => b.score - a.score) // จัดเรียงตามคะแนนความเสี่ยง
      .slice(0, 5); // แสดง 5 รายการที่สำคัญที่สุด
  }, [props.allRisks]);

  return (
    <div className="panel-dark p-5 h-full">
      <div className="panel-title flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle size={20} />
          <span>ความเสี่ยงที่ต้องโฟกัส ({topFocusRisks.length} รายการ)</span>
        </div>
        <span
          className="text-sm font-medium rounded-full px-3 py-1"
          style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
        >
          {red}R • {amber}A
        </span>
      </div>
      
      {topFocusRisks.length ? (
        <ul className="space-y-2">
          {topFocusRisks.map((a) => (
            <li 
              key={a.code} 
              className="panel-dark p-3 flex items-center justify-between"
              // แถบสีด้านซ้ายตาม Priority: Critical = แดง (Danger), High = เหลือง (Warning)
              style={{ borderLeft: `4px solid ${a.priority === 'critical' ? 'var(--danger)' : 'var(--warning)'}` }}
            >
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: statusColor(a.status) }} />
                <div className="font-medium text-[var(--text-1)]">{a.label}</div>
              </div>
              <span className="text-xs muted">{renderValue(a)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-[var(--success)] font-medium p-4 text-center border border-dashed border-[var(--success)] rounded-lg mt-4">
          ✨ ไม่มีรายการ Critical/High Priority ที่ต้องโฟกัสในตอนนี้
        </div>
      )}
      
      <div className="mt-3">
        <Link href={`/checklist`} className="btn-primary inline-flex items-center gap-2">
          Assign งาน <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}