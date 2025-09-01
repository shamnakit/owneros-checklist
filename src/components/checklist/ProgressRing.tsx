// ================================================
// File: src/components/checklist/ProgressRing.tsx
// ================================================
import React from "react";


type Props = {
value: number; // 0..100
label?: string;
tier?: "Excellent" | "Developing" | "Early";
size?: number; // px
};


const circle = {
radius: 56,
strokeWidth: 10,
};


export default function ProgressRing({ value, label, tier, size = 160 }: Props) {
const r = circle.radius;
const c = 2 * Math.PI * r;
const v = Math.max(0, Math.min(100, value));
const dash = (v / 100) * c;


return (
<div className="flex flex-col items-center justify-center">
<svg width={size} height={size} viewBox="0 0 150 150" className="block">
<circle cx="75" cy="75" r={r} fill="none" stroke="#E5E7EB" strokeWidth={circle.strokeWidth} />
<circle
cx="75"
cy="75"
r={r}
fill="none"
stroke="#10B981"
strokeWidth={circle.strokeWidth}
strokeLinecap="round"
strokeDasharray={`${dash} ${c - dash}`}
transform="rotate(-90 75 75)"
/>
<text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-gray-800" fontSize="28" fontWeight="700">
{v}%
</text>
</svg>
{label && <div className="mt-2 text-sm text-gray-600">{label}</div>}
{tier && (
<span className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
{tier}
</span>
)}
</div>
);
}