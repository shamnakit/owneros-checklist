// ================================================
};


type Props = {
group: GroupKey;
percent: number;
year: number;
};


export default function CategoryCard({ group, percent, year }: Props) {
const title = GROUP_TITLES[group];
const href = `/checklist/${group}?year=${year}`;


return (
<Link href={href} className="group block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
<div className="flex items-center gap-3">
<div className="text-gray-700">{ICONS[group]}</div>
<div className="min-w-0 flex-1">
<div className="truncate font-semibold">{title}</div>
<div className="text-sm text-gray-500">ความครบถ้วน: {percent}%</div>
</div>
<ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
</div>
<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
<div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
</div>
</Link>
);
}