// src/components/dashboard/MissionRow.tsx
'use client';
import React from "react";
import MissionCard from "@/components/dashboard/MissionCard";

export default function MissionRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <MissionCard category="strategy"  progressPct={62} status="HOLD"
        kpi1={{label:"Milestones", value:"7/12"}} kpi2={{label:"Δv Margin", value:"+12%"}} />
      {/* ✅ ใช้ alias "org" ได้ เพราะเรา coerce เป็น "structure" แล้ว */}
      <MissionCard category="org"       progressPct={54} status="HOLD"
        kpi1={{label:"Decision Latency", value:"-18%"}} kpi2={{label:"Drill Pass", value:"82%"}} />
      <MissionCard category="sop"       progressPct={48} status="NO-GO"
        kpi1={{label:"Procedure Rate", value:"76%"}} kpi2={{label:"Incidents", value:"2"}} />
      <MissionCard category="hr"        progressPct={71} status="GO"
        kpi1={{label:"Crew Readiness", value:"89%"}} kpi2={{label:"Training Hrs", value:"14"}} />
      <MissionCard category="finance"   progressPct={58} status="HOLD"
        kpi1={{label:"Power Margin", value:"+9%"}} kpi2={{label:"Waste", value:"3.1%"}} />
      <MissionCard category="sales"     progressPct={64} status="GO"
        kpi1={{label:"Lead Win", value:"32%"}} kpi2={{label:"NPS", value:"56"}} />
    </div>
  );
}
