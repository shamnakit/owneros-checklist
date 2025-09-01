// ================================================
// File: src/hooks/useChecklist.ts
// ================================================
import { useEffect, useMemo, useState } from "react";
import type { GroupKey, ChecklistItem, OverviewResponse } from "../types/checklist";
import { ChecklistService } from "../services/checklist.service";


export function useChecklistOverview(year: number) {
const [data, setData] = useState<OverviewResponse | null>(null);
const [loading, setLoading] = useState(true);


useEffect(() => {
let mounted = true;
setLoading(true);
ChecklistService.getOverview(year).then((d) => {
if (mounted) setData(d);
setLoading(false);
});
return () => { mounted = false; };
}, [year]);


return { data, loading };
}


export function useChecklistGroup(group: GroupKey, year: number) {
const [items, setItems] = useState<ChecklistItem[]>([]);
const [loading, setLoading] = useState(true);


useEffect(() => {
let mounted = true;
setLoading(true);
ChecklistService.getGroupItems(group, year).then((it) => {
if (mounted) setItems(it);
setLoading(false);
});
return () => { mounted = false; };
}, [group, year]);


const percent = useMemo(() => {
if (!items.length) return 0;
const done = items.filter((i) => (i.maturity ?? 0) >= 1 && (i.has_evidence ?? false)).length;
return Math.round((done / items.length) * 100);
}, [items]);


return { items, setItems, percent, loading };
}