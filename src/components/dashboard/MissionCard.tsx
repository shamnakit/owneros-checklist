// src/components/dashboard/MissionCard.tsx
'use client';
import React from "react";
import {
  categoryMeta,
  type CategoryAlias,
  coerceCategory,
  type StatusKey,
  getStatusColor,
} from "@/theme/moonship";

type KPI = { label: string; value: string };

type Props = {
  category: CategoryAlias;         // ✅ รับ "org" ได้
  progressPct: number;
  status: StatusKey;               // "GO" | "HOLD" | "NO-GO"
  kpi1?: KPI;
  kpi2?: KPI;
};

const statusClass = (s: StatusKey) =>
  s === "GO" ? "chip chip-go" : s === "HOLD" ? "chip chip-hold" : "chip chip-nogo";

export default function MissionCard({ category, progressPct, status, kpi1, kpi2 }: Props) {
  const cat = coerceCategory(category);
  const meta = categoryMeta[cat];

  const pct = Math.max(0, Math.min(100, Math.round(progressPct)));

  return (
    <div className={`card-moon p-4 ${meta.glowClass}`} style={{ borderColor: `${meta.color}40` }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <meta.icon size={18} color={meta.color} />
          <h3 className="text-base font-semibold">{meta.labelTH}</h3>
        </div>
        <span className={statusClass(status)}>● {status}</span>
      </div>

      {/* KPI mini grid */}
      {(kpi1 || kpi2) && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs opacity-90">
          {kpi1 && (
            <div className="flex justify-between gap-2">
              <span className="subtle">{kpi1.label}</span>
              <span className="font-semibold">{kpi1.value}</span>
            </div>
          )}
          {kpi2 && (
            <div className="flex justify-between gap-2">
              <span className="subtle">{kpi2.label}</span>
              <span className="font-semibold">{kpi2.value}</span>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      <div className="mt-3">
        <div className="progress-track h-2 w-full">
          {/* ใช้สีสถานะเป็นบาร์ เพื่อแยกจาก bar ชุดคุณภาพได้ */}
          <div
            className="h-2 rounded-full"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${getStatusColor(status)} 0%, #FFFFFFAA 130%)`,
              boxShadow: `0 0 18px ${getStatusColor(status)}40`,
            }}
          />
        </div>
        <div className="mt-2 text-right text-xs muted">{pct}%</div>
      </div>
    </div>
  );
}
