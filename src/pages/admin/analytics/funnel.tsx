// =============================
// 5) pages/admin/analytics/funnel.tsx
// =============================
import { useEffect, useState } from "react";
import AdminTabs from "@/components/admin/AdminTabs";


export default function FunnelPage() {
const [data, setData] = useState<any>(null);
const [loading, setLoading] = useState(true);


useEffect(() => {
(async () => {
try {
setLoading(true);
const res = await fetch(`/api/analytics/funnel?date_from=-14d`);
const json = await res.json();
setData(json);
} catch (e) {
console.error(e);
} finally {
setLoading(false);
}
})();
}, []);


return (
<div className="space-y-6">
<h1 className="text-2xl font-semibold">Analytics</h1>
<AdminTabs />


<div className="rounded-2xl border border-neutral-800 p-4 bg-neutral-900/50">
{loading ? (
<div className="text-neutral-400">Loading funnel…</div>
) : (
<pre className="text-xs whitespace-pre-wrap text-neutral-300">{JSON.stringify(data, null, 2)}</pre>
)}
</div>
</div>
);
}