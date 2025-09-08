// src/theme/moonship.ts
import type { LucideIcon } from "lucide-react";
import { Rocket, Crosshair, PanelsTopLeft, ListChecks, Users, Wallet, Megaphone, Gauge } from "lucide-react";

export type CategoryKey = "strategy" | "org" | "sop" | "hr" | "finance" | "sales";
export type StatusKey = "GO" | "HOLD" | "NO-GO";

export const moonColors = {
  bg: {
    spaceBlack: "#0B0F1A",
    deepNavy: "#0F1E2E",
    starlight: "#E6EDF5",
  },
  category: {
    strategy: "#FFD54A", // Moon Yellow
    org: "#2DD4BF",      // Oxygen Cyan
    sop: "#7C3AED",      // Orbit Purple
    hr: "#22C55E",       // GO Green
    finance: "#F59E0B",  // HOLD Amber
    sales: "#FF7A1A",    // Thruster Orange
  },
  status: {
    "GO": "#22C55E",
    "HOLD": "#F59E0B",
    "NO-GO": "#EF4444",
  },
} as const;

export const categoryMeta: Record<CategoryKey, { labelTH: string; icon: LucideIcon; color: string }> = {
  strategy: { labelTH: "กลยุทธ์", icon: Rocket, color: moonColors.category.strategy },
  org:      { labelTH: "โครงสร้างองค์กร", icon: PanelsTopLeft, color: moonColors.category.org },
  sop:      { labelTH: "คู่มือปฏิบัติงาน (SOP)", icon: ListChecks, color: moonColors.category.sop },
  hr:       { labelTH: "บุคคล & HR", icon: Users, color: moonColors.category.hr },
  finance:  { labelTH: "การเงิน", icon: Wallet, color: moonColors.category.finance },
  sales:    { labelTH: "ลูกค้า & การขาย", icon: Megaphone, color: moonColors.category.sales },
};

export const statusColor = (s: StatusKey) => moonColors.status[s];
