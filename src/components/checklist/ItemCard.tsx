// ================================================
item: ChecklistItem;
onSave?: (item: Partial<ChecklistItem>) => Promise<void> | void;
onUpload?: (file: File, itemId: string) => Promise<void> | void;
}


export default function ItemCard({ item, onSave, onUpload }: Props) {
const [text, setText] = useState(item.input_text ?? "");
const maturity = item.maturity ?? 0;
const state: "done" | "missing-evidence" | "todo" =
maturity >= 1 && item.has_evidence ? "done" : maturity >= 1 ? "missing-evidence" : "todo";


const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
if (!file) return;
await onUpload?.(file, item.id);
};


const handleSave = async () => {
await onSave?.({ id: item.id, input_text: text });
};


const setMaturity = async (val: Maturity) => {
await onSave?.({ id: item.id, maturity: val });
};


return (
<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
<div className="flex items-start justify-between gap-3">
<div>
<div className="font-medium">{item.index_number ? `${item.index_number}. ` : ""}{item.name}</div>
<div className="mt-1 text-sm text-gray-500">ID: {item.id}</div>
</div>
<StatusBadge state={state} />
</div>


<div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
<button
className={`rounded-full px-3 py-1 border ${maturity===0?"bg-gray-100 border-gray-300":"border-gray-200"}`}
onClick={() => setMaturity(0)}
>ไม่มี</button>
<button
className={`rounded-full px-3 py-1 border ${maturity===1?"bg-amber-100 border-amber-300":"border-gray-200"}`}
onClick={() => setMaturity(1)}
>บางส่วน</button>
<button
className={`rounded-full px-3 py-1 border ${maturity===2?"bg-emerald-100 border-emerald-300":"border-gray-200"}`}
onClick={() => setMaturity(2)}
>ครบใช้งานจริง</button>
</div>


<div className="mt-3">
<textarea
className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
placeholder="พิมพ์บันทึก/สรุปหลักฐาน..."
value={text}
onChange={(e) => setText(e.target.value)}
rows={3}
/>
</div>


<div className="mt-3 flex items-center gap-3">
<label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
แนบไฟล์
<input type="file" className="hidden" onChange={handleUpload} />
</label>
{item.file_path && <a className="text-sm text-emerald-700 underline" href={item.file_path} target="_blank" rel="noreferrer">เปิดไฟล์</a>}
<button onClick={handleSave} className="ml-auto rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">บันทึก</button>
</div>
</div>
);
}