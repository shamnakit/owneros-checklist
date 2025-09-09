// src/theme/moonship.ts
import type { LucideIcon } from "lucide-react";
import { Rocket, GitBranch, ListChecks, Users, Wallet, Megaphone } from "lucide-react";

export type CategoryKey   = "strategy" | "structure" | "sop" | "hr" | "finance" | "sales";
/** ✅ รองรับ alias "org" ให้เท่ากับ "structure" */
export type CategoryAlias = CategoryKey | "org";
export type StatusKey     = "GO" | "HOLD" | "NO-GO";

/** map alias -> คีย์จริง */
export const coerceCategory = (k: CategoryAlias): CategoryKey =>
  k === "org" ? "structure" : k;

/** โทเค็นสีธีมอวกาศ + ดวงจันทร์ (สอดคล้องกับ globals.css) */
export const moonColors = {
  bg: {
    space: "#0A1020",
    navy:  "#0E1B2E",
    starlight: "#EAF2FF",
  },
  accents: {
    astroBlue: "#9CC3FF",
    ionTeal:   "#2DE1C2",
    lunarCyan: "#2AA9FF",
    orbitPink: "#FF5B99",
  },
  category: {
    strategy: "#FFD54A",
    structure:"#2DD4BF",
    sop:      "#9D7CFF",
    hr:       "#22C55E",
    finance:  "#F6C453",
    sales:    "#FF7A1A",
  } as Record<CategoryKey,string>,
  status: {
    GO:   "#2DE1C2",
    HOLD: "#F6C453",
    "NO-GO": "#FF6B6B",
  } as Record<StatusKey,string>,
};

/** เมตาตามหมวด (ไทย+อังกฤษ, สี, ไอคอน, glow) */
export const categoryMeta: Record<
  CategoryKey,
  { label: string; labelTH: string; color: string; icon: LucideIcon; glowClass: string }
> = {
  strategy: {
    label: "Strategy",
    labelTH: "กลยุทธ์องค์กร",
    color: moonColors.category.strategy,
    icon: Rocket,
    glowClass: "glow-strategy",
  },
  structure: {
    label: "Org Structure",
    labelTH: "โครงสร้างและกำกับดูแล",
    color: moonColors.category.structure,
    icon: GitBranch,               // ← เปลี่ยนจาก Sitemap เป็น GitBranch
    glowClass: "glow-structure",
  },
  sop: {
    label: "Processes & SOP",
    labelTH: "กระบวนการและคู่มือ",
    color: moonColors.category.sop,
    icon: ListChecks,
    glowClass: "glow-sop",
  },
  hr: {
    label: "People & HR",
    labelTH: "บุคลากรและ HR",
    color: moonColors.category.hr,
    icon: Users,
    glowClass: "glow-hr",
  },
  finance: {
    label: "Finance & Performance",
    labelTH: "การเงินและการวัดผล",
    color: moonColors.category.finance,
    icon: Wallet,
    glowClass: "glow-finance",
  },
  sales: {
    label: "Customers & Sales",
    labelTH: "ลูกค้า/การตลาด/การขาย",
    color: moonColors.category.sales,
    icon: Megaphone,
    glowClass: "glow-sales",
  },
};

/** helper */
export const getCategoryColor = (k: CategoryKey) => moonColors.category[k];
export const getStatusColor   = (k: StatusKey)   => moonColors.status[k];

/** โทนกราฟ/โปรเกรส */
export const chartTheme = {
  radar: {
    fill: "rgba(45, 225, 194, .35)", // ionTeal 35%
    stroke: "#2DE1C2",
    dot: "#2DE1C2",
  },
  progress: {
    quality:    "#2DE1C2", // ionTeal
    completion: "#2AA9FF", // lunarCyan
    track: "rgba(255,255,255,.20)",
  },
  donut: {
    arc:   "#FF5B99",      // orbitPink
    track: "rgba(255,255,255,.16)",
  },
};
