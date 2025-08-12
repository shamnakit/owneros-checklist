import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUserProfile } from "@/contexts/UserProfileContext";

type ChecklistRow = Record<string, any>;

// ปรับให้ตรงสคีมาจริงของคุณ
const TB = {
  name: "checklists",  // ← ชื่อตาราง เช่น "checklists" หรือ "checklist_items"
  userCol: "owner_id", // ← คอลัมน์ผู้ใช้ เช่น "owner_id" หรือ "user_id" (uuid)
  yearCol: "year",     // ← คอลัมน์ปี (integer)
};

function toIntOrNull(v: any): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function loadChecklistSafe(yearInput?: any) {
  // ต้องมี user ก่อน
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { rows: [] as ChecklistRow[], error: null as any };

  // ปีต้องเป็นตัวเลขเท่านั้น
  const year = toIntOrNull(yearInput);

  // ใช้ any เพื่อตัดปัญหา generic ลึก (แก้ TS: excessively deep)
  const sb: any = supabase;

  let query: any = sb.from(TB.name as string).select("*").eq(TB.userCol as string, uid);
  if (year !== null) query = query.eq(TB.yearCol as string, year);

  const { data, error } = await query; // ไม่ order เพื่อกันคอลัมน์ id/created_at ไม่ตรงสคีมา
  if (error) {
    console.error("CHECKLIST LOAD ERROR:", {
      code: error.code,
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
      tb: TB,
      uid,
      yearInput,
      parsedYear: year,
    });
    return { rows: [] as ChecklistRow[], error };
  }
  return { rows: (data as ChecklistRow[]) ?? [], error: null };
}

export default function ChecklistPage() {
  const { loading: profileLoading } = useUserProfile();

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [year, setYear] = useState<number | "">(currentYear);
  const [rows, setRows] = useState<ChecklistRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errMsg, setErrMsg] = useState<string>("");

  const reload = async (y: number | "") => {
    setLoading(true);
    setErrMsg("");
    try {
      const { rows, error } = await loadChecklistSafe(y === "" ? null : y);
      if (error) {
        setErrMsg(error.message || "โหลด checklist ผิดพลาด");
        setRows([]);
      } else {
        setRows(rows);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileLoading) {
      // โปรไฟล์โหลดเสร็จแล้วค่อยยิง (profile อาจเป็น fallback ได้)
      reload(year);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoading]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📋 Checklist</h1>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">ปี:</label>
          <input
            type="number"
            className="border rounded px-3 py-1 w-28"
            value={year}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v === "") {
                setYear("");
                return;
              }
              const n = Number(v);
              if (Number.isFinite(n)) setYear(n as any);
            }}
            onBlur={() => reload(year)}
          />
          <button
            className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200"
            onClick={() => reload(year)}
          >
            โหลดใหม่
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">กำลังโหลดข้อมูล…</div>
      ) : errMsg ? (
        <div className="p-3 rounded bg-red-50 text-red-600">
          โหลด checklist ผิดพลาด: {errMsg}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded border p-4 text-gray-600">
          ยังไม่มีรายการในปีนี้
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r, idx) => (
            <div key={(r as any).id ?? idx} className="rounded border p-4">
              <pre className="text-xs bg-slate-50 p-2 rounded overflow-auto">
                {JSON.stringify(r, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
