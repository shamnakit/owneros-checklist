// =============================================
// File: src/components/scoring/ScoreTierBadge.tsx
// =============================================
import { tierBadgeColor, toTier, TOTAL_MAX } from "@/types/scoring";


export default function ScoreTierBadge({ total }: { total: number }) {
const tier = toTier(total);
const color = tierBadgeColor(tier);
const pct = Math.round((total / TOTAL_MAX) * 1000) / 10; // 1 ตำแหน่ง
return (
<div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${color}`}>
<span className="text-sm font-semibold">{tier}</span>
<span className="text-xs opacity-90">{total} / {TOTAL_MAX} ({pct}%)</span>
</div>
);
}