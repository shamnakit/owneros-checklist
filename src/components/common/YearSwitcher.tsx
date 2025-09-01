// ================================================
// File: src/components/common/YearSwitcher.tsx
// ================================================
import React from "react";
import { useRouter } from "next/router";


export default function YearSwitcher({ year }: { year: number }) {
const router = useRouter();
const years = [2024, 2025, 2026];
const onChange = (y: number) => {
const url = { pathname: router.pathname, query: { ...router.query, year: y } } as any;
router.push(url);
};
return (
<div className="inline-flex items-center gap-2">
<span className="text-sm text-gray-500">ปี:</span>
<select className="rounded-md border border-gray-300 p-1" value={year} onChange={(e) => onChange(parseInt(e.target.value))}>
{years.map((y) => (
<option key={y} value={y}>{y}</option>
))}
</select>
</div>
);
}