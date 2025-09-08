// src/components/dashboard/MissionCard.tsx
'use client';
import React from "react";
import { categoryMeta, type CategoryKey, type StatusKey } from "@/theme/moonship";

type Props = {
  category: CategoryKey;
  progressPct: number; // 0..100
  kpi1?: { label: string; value: string };
  kpi2?: { label: string; value: string };
  status: StatusKey; // "GO" | "HOLD" | "NO-GO"
  onClick?: () => void;
};

const ringSize = 64;
const stroke = 8;
const r = (ringSize - stroke) / 2;
const C = 2 * Math.PI * r;

function MissionCard({ category, progressPct, kpi1, kpi2, status, onClick }: Props) {
  const meta = categoryMeta[category];
  const ring = Math.max(0, Math.min(100, progressPct));
  const dash = (ring / 100) * C;
  const glowClass = `glow-${category}`;

  return (
    <button onClick={onClick} className={`card-moon ${glowClass} w-full text-left p-4 transition hover:scale-[1.01]`}>
      <div className="flex items-start gap-4">
        {/* Progress Ring */}
        <div className="relative" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize}>
            <circle cx={ringSize/2} cy={ringSize/2} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} fill="none" />
            <circle
              cx={ringSize/2} cy={ringSize/2} r={r}
              stroke={meta.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${ringSize/2} ${ringSize/2})`}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-sm font-semibold">{Math.round(ring)}%</div>
        </div>

        {/* Text */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <meta.icon size={18} color={meta.color} />
            <h3 className="text-base font-semibold">{meta.labelTH}</h3>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs opacity-90">
            {kpi1 && <div className="flex justify-between gap-2"><span className="opacity-75">{kpi1.label}</span><span className="font-semibold">{kpi1.value}</span></div>}
            {kpi2 && <div className="flex justify-between gap-2"><span className="opacity-75">{kpi2.label}</span><span className="font-semibold">{kpi2.value}</span></div>}
          </div>
          <div className="mt-3">
            <span className={`chip ${status === "GO" ? "chip-go" : status === "HOLD" ? "chip-hold" : "chip-nogo"}`}>● {status}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default MissionCard;        // ✅ ย้ำ export
export {};                         // ✅ บอก TS ชัด ๆ ว่านี่คือ module
