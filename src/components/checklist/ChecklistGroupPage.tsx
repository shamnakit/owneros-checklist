// src/components/checklist/ChecklistGroupPage.tsx

import Breadcrumbs from "@/components/common/Breadcrumbs";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUserProfile } from "@/hooks/useUserProfile";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const DEFAULT_TEMPLATES: Record<string, { name: string; index_number: number }[]> = {
  "โครงสร้างองค์กร": [
    { name: "มี Org Chart แสดงสายบังคับบัญชา", index_number: 1 },
    { name: "มี JD ทุกตำแหน่งในทีม", index_number: 2 },
    { name: "มี KPI หรือเป้าหมายรายบุคคล", index_number: 3 },
    { name: "Review KPI อย่างน้อยทุก 6 เดือน", index_number: 4 },
  ],
  "คู่มือปฏิบัติงาน": [
    { name: "มี SOP สำหรับกระบวนการหลักของบริษัท", index_number: 1 },
    { name: "มี WI สำหรับงานที่ต้องการรายละเอียด", index_number: 2 },
    { name: "มี Flowchart ขั้นตอนงานสำคัญ", index_number: 3 },
    { name: "มีระบบ Version Control หรือ Update เอกสาร", index_number: 4 },
    { name: "มีการสื่อสารคู่มือกับพนักงานใหม่", index_number: 5 },
  ],
  "ระบบบุคคล & HR": [
    { name: "มีฟอร์มสมัครงาน / ขั้นตอนรับพนักงาน", index_number: 1 },
    { name: "มี Onboarding Checklist", index_number: 2 },
    { name: "มีระบบประเมินผล (Probation & Annual)", index_number: 3 },
    { name: "มีแผนพัฒนาศักยภาพพนักงาน", index_number: 4 },
    { name: "มีนโยบาย HR หรือคู่มือพนักงาน", index_number: 5 },
    { name: "มี Feedback 2 ทาง (พนักงาน > หัวหน้า)", index_number: 6 },
    { name: "มีระบบ Incentive / ปรับเงินเดือนตามผลงาน", index_number: 7 },
  ],
  "ระบบการเงิน": [
    { name: "มีงบประมาณประจำปี", index_number: 1 },
    { name: "มีรายงานกระแสเงินสดรายเดือน", index_number: 2 },
    { name: "มีระบบควบคุมต้นทุน / วางแผนกำไร", index_number: 3 },
    { name: "มีการวิเคราะห์ Break-even / Profit Margin", index_number: 4 },
    { name: "เจ้าของเข้าใจงบการเงินเบื้องต้น", index_number: 5 },
  ],
  "ระบบลูกค้า / ขาย": [
    { name: "มี Customer Journey Map", index_number: 1 },
    { name: "มี CRM หรือฐานข้อมูลลูกค้า", index_number: 2 },
    { name: "มีระบบติดตาม Lead / Pipeline", index_number: 3 },
    { name: "มีแบบฟอร์ม Feedback หลังการขาย", index_number: 4 },
    { name: "มีการวัด NPS หรือความพึงพอใจลูกค้า", index_number: 5 },
  ],
};

type UUID = string;
const yearOptions = [2024, 2025, 2026];

type TemplateRow = { id: UUID; name: string; index_number: number; group_name: string };
type ChecklistRow = {
  id: UUID;
  template_id: UUID;
  name: string;
  group_name: string;
  year_version: number;
  input_text: string | null;
  file_path: string | null;
  file_key: string | null;
  updated_at: string | null;
  user_id: UUID;
};
type ViewItem = ChecklistRow & { index_number: number; display_name: string };
type Filter = "ALL" | "PENDING" | "TEXT_ONLY" | "WITH_FILE";
type ToastType = "success" | "error" | "info";

function slugify(filename: string) {
  const i = filename.lastIndexOf(".");
  const base = (i >= 0 ? filename.slice(0, i) : filename)
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙_\- ]+/gi, "")
    .trim()
    .replace(/\s+/g, "-");
  const ext = i >= 0 ? filename.slice(i).toLowerCase() : "";
  return `${base}${ext}`;
}
function prettyFileName(row: ViewItem) {
  const raw = row.file_key?.split("/").pop() || row.file_path?.split("/").pop() || "";
  const parts = raw.split("-");
  const tsIdx = parts.findIndex((p) => /^\d{10,}$/.test(p));
  if (tsIdx !== -1) return parts.slice(tsIdx + 1).join("-");
  return raw.replace(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}-/i, "");
}
function truncate(s: string, n = 150) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
function Toast({ type, message }: { type: ToastType; message: string }) {
  const color = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-slate-700";
  return <div className={`fixed bottom-6 right-6 z-50 text-white px-4 py-2 rounded-lg shadow-lg ${color}`}>{message}</div>;
}

export default function ChecklistGroupPage({ groupName, groupNo }: { groupName: string; groupNo: number }) {
  const { profile } = useUserProfile();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [items, setItems] = useState<ViewItem[]>([]);
  const [editing, setEditing] = useState<Record<UUID, string>>({});
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2200);
  };

  const printRef = useRef<HTMLDivElement>(null);
  const autoSeededRef = useRef(false);

  // โหลด template ของหมวดนี้ (และ auto-seed ถ้าไม่พบ)
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("id,name,index_number,group_name")
        .eq("group_name", groupName)
        .order("index_number", { ascending: true });

      if (error) {
        console.error(error);
        showToast("โหลดเทมเพลตไม่สำเร็จ", "error");
        return;
      }

      const list = ((data ?? []) as unknown) as TemplateRow[];
      if (active) setTemplates(list);

      // ไม่มี template → auto-seed
      if (active && list.length === 0 && !autoSeededRef.current) {
        autoSeededRef.current = true; // กันลูป
        await autoSeedTemplatesOrDirect();
        // โหลดเทมเพลตใหม่จากผล upsert (อาจถูก set แล้วในทางหลัก)
        const { data: data2 } = await supabase
          .from("checklist_templates")
          .select("id,name,index_number,group_name")
          .eq("group_name", groupName)
          .order("index_number", { ascending: true });
        if (active) setTemplates(((data2 ?? []) as unknown) as TemplateRow[]);
      }
    })();
    return () => {
      active = false;
    };
  }, [groupName]);

  const templateMap = useMemo(() => {
    const m = new Map<string, TemplateRow>();
    templates.forEach((t) => m.set(t.id, t));
    return m;
  }, [templates]);

  // สร้างเทมเพลตอัตโนมัติ (พยายาม upsert ลง template ก่อน; ถ้าไม่ได้ seed ตรงเข้า checklists_v2)
  const autoSeedTemplatesOrDirect = async () => {
    const defs = DEFAULT_TEMPLATES[groupName] || [];
    if (defs.length === 0) return;
    try {
      setSeeding(true);
      // 1) ทางหลัก: upsert ลง checklist_templates + ขอแถวที่เพิ่งเขียนกลับมา
      const { data: tmplRows, error: tmplErr } = await supabase
        .from("checklist_templates")
        .upsert(
          defs.map((d) => ({
            name: d.name,
            group_name: groupName,
            index_number: d.index_number,
          })),
          { onConflict: "group_name,name" }
        )
        .select("id,name,index_number,group_name");

      if (!tmplErr) {
        // อัปเดต state ด้วยแถวที่เพิ่ง upsert ได้เลย
        setTemplates(((tmplRows ?? []) as unknown) as TemplateRow[]);
        showToast("สร้างหัวข้ออัตโนมัติแล้ว ✅", "success");
        return;
      }

      // 2) Fallback: seed ตรงเข้า checklists_v2 ของผู้ใช้/ปีปัจจุบัน
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return;

      const now = new Date().toISOString();
      const payload = defs.map((d) => ({
        id: crypto.randomUUID(), // ให้มี id เลย เพื่ออัปเดต state ทันที
        user_id: uid,
        template_id: crypto.randomUUID(), // ไอดีเทียม
        group_name: groupName,
        name: d.name,
        year_version: year,
        input_text: null,
        file_path: null,
        file_key: null,
        updated_at: now,
      }));

      await supabase.from("checklists_v2").upsert(payload);

      // อัปเดตหน้าจอให้เห็นทันที (แม้ template ยังไม่มี)
      const vItems: ViewItem[] = payload
        .map((r, i) => ({
          ...(r as any),
          index_number: defs[i].index_number,
          display_name: defs[i].name,
        }))
        .sort((a, b) => a.index_number - b.index_number);

      setItems(vItems);
      const e: Record<UUID, string> = {};
      vItems.forEach((it) => (e[it.id] = ""));
      setEditing(e);

      showToast("สร้างหัวข้ออัตโนมัติแล้ว ✅", "success");
    } finally {
      setSeeding(false);
    }
  };

  // โหลด/seed checklist รายปี (เมื่อ templates พร้อม หรือมี fallback แล้ว)
  useEffect(() => {
    if (!profile?.id) return;
    let active = true;

    const fetchOrSeed = async () => {
      setLoading(true);

      const { data: rows, error } = await supabase
        .from("checklists_v2")
        .select("id,template_id,name,group_name,input_text,file_path,file_key,updated_at,year_version,user_id")
        .eq("group_name", groupName)
        .eq("year_version", year)
        .eq("user_id", profile.id);

      if (error) {
        console.error(error);
        showToast("โหลดรายการไม่สำเร็จ", "error");
        setLoading(false);
        return;
      }

      const existing = ((rows ?? []) as unknown) as ChecklistRow[];

      // ถ้ายังไม่มีรายการ → seed จาก template ที่มีอยู่
      if (existing.length === 0 && templates.length > 0) {
        const payload = templates.map((t) => ({
          user_id: profile.id,
          template_id: t.id,
          group_name: groupName,
          name: t.name,
          year_version: year,
          input_text: null as string | null,
          file_path: null as string | null,
          file_key: null as string | null,
        }));
        const { error: upsertError } = await supabase
          .from("checklists_v2")
          .upsert(payload, { onConflict: "user_id,template_id,year_version", ignoreDuplicates: false })
          .select("id,template_id,name,group_name,year_version,input_text,file_path,file_key,updated_at,user_id"); // ✅ ขอคืนค่า
        if (upsertError) {
          console.error(upsertError);
          showToast("สร้างรายการจากเทมเพลตไม่สำเร็จ", "error");
          setLoading(false);
          return;
        }
      }

      // โหลดล่าสุดอีกรอบ
      const { data: latest, error: refetchErr } = await supabase
        .from("checklists_v2")
        .select("id,template_id,name,group_name,input_text,file_path,file_key,updated_at,year_version,user_id")
        .eq("group_name", groupName)
        .eq("year_version", year)
        .eq("user_id", profile.id);

      if (refetchErr) {
        console.error(refetchErr);
        showToast("โหลดรายการไม่สำเร็จ", "error");
        setLoading(false);
        return;
      }

      if (active) {
        const defs = DEFAULT_TEMPLATES[groupName] || [];
        const orderMap = new Map(defs.map((d) => [d.name, d.index_number]));

        const l = ((latest ?? []) as unknown) as ChecklistRow[];
        const merged: ViewItem[] = l
          .map((r) => {
            const t = templateMap.get(r.template_id);
            return {
              ...r,
              index_number: t?.index_number ?? orderMap.get(r.name) ?? 9999,
              display_name: t?.name ?? r.name,
            };
          })
          .sort((a, b) => a.index_number - b.index_number);

        setItems(merged);
        const e: Record<UUID, string> = {};
        merged.forEach((it) => (e[it.id] = it.input_text || ""));
        setEditing(e);
        setLoading(false);
      }
    };

    fetchOrSeed();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, profile?.id, templates.length, groupName]);

  // ---- actions ----
  const handleSave = async (id: UUID) => {
    const value = editing[id] ?? "";
    const updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("checklists_v2")
      .update({ input_text: value, updated_at })
      .eq("id", id)
      .eq("user_id", profile!.id)
      .select("id,input_text,updated_at")
      .single(); // ✅ ขอคืนค่า 1 แถว

    if (error) {
      console.error(error);
      showToast("บันทึกไม่สำเร็จ", "error");
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, input_text: data?.input_text ?? value, updated_at: data?.updated_at ?? updated_at } : it
      )
    );
    showToast("บันทึกแล้ว ✅", "success");
  };

  const handleFileUpload = async (row: ViewItem, file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) {
        showToast("ไฟล์ใหญ่เกิน 10MB", "error");
        return;
      }
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) {
        showToast("ไม่พบ session ผู้ใช้", "error");
        return;
      }
      const ts = Date.now();
      const safe = slugify(file.name);
      const newKey = `${uid}/${year}/${row.template_id}-${ts}-${safe}`;

      const { error: uploadErr } = await supabase.storage
        .from("checklist-files")
        .upload(newKey, file, { upsert: true, contentType: file.type });
      if (uploadErr) {
        console.error(uploadErr);
        showToast("อัปโหลดไฟล์ไม่สำเร็จ", "error");
        return;
      }

      const { data: pub } = supabase.storage.from("checklist-files").getPublicUrl(newKey);
      const newUrl = (pub?.publicUrl as string) || "";

      const updated_at = new Date().toISOString();
      const { error: updErr } = await supabase
        .from("checklists_v2")
        .update({ file_path: newUrl, file_key: newKey, updated_at })
        .eq("id", row.id)
        .eq("user_id", profile!.id);
      if (updErr) {
        console.error(updErr);
        showToast("บันทึกไฟล์ลงฐานข้อมูลไม่สำเร็จ", "error");
        return;
      }

      if (row.file_key) {
        const { error: delErr } = await supabase.storage.from("checklist-files").remove([row.file_key]);
        if (delErr) console.warn("⚠️ ลบไฟล์เก่าไม่ได้:", delErr);
      }

      setItems((prev) =>
        prev.map((it) => (it.id === row.id ? { ...it, file_path: newUrl, file_key: newKey, updated_at } : it))
      );
      showToast("อัปโหลดไฟล์เรียบร้อย ✅", "success");
    } catch (e) {
      console.error(e);
      showToast("เกิดข้อผิดพลาดระหว่างอัปโหลดไฟล์", "error");
    }
  };

  const handleFileDelete = async (row: ViewItem) => {
    if (!row.file_key) return;
    const { error: delErr } = await supabase.storage.from("checklist-files").remove([row.file_key]);
    if (delErr) {
      console.error(delErr);
      showToast("ลบไฟล์จากสตอเรจไม่ได้", "error");
      return;
    }

    const updated_at = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("checklists_v2")
      .update({ file_path: null, file_key: null, updated_at })
      .eq("id", row.id)
      .eq("user_id", profile!.id);
    if (updErr) {
      console.error(updErr);
      showToast("อัปเดตฐานข้อมูลไม่สำเร็จ", "error");
      return;
    }

    setItems((prev) =>
      prev.map((it) => (it.id === row.id ? { ...it, file_path: null, file_key: null, updated_at } : it))
    );
    showToast("ลบไฟล์เรียบร้อย ✅", "success");
  };

  const isComplete = (it: ViewItem) => !!it.file_key || (it.input_text?.trim().length || 0) >= 100;
  const isTextOnly = (it: ViewItem) => !it.file_key && (it.input_text?.trim().length || 0) >= 100;

  const stats = useMemo(() => {
    const total = items.length || 1;
    const withFile = items.filter((x) => !!x.file_key).length;
    const textOnly = items.filter(isTextOnly).length;
    const pending = items.length - withFile - textOnly;
    const percent = Math.round(((withFile + textOnly) / total) * 100);
    return { total: items.length, withFile, textOnly, pending, percent };
  }, [items]);

  const filteredItems = useMemo(() => {
    switch (filter) {
      case "PENDING":
        return items.filter((x) => !isComplete(x));
      case "TEXT_ONLY":
        return items.filter(isTextOnly);
      case "WITH_FILE":
        return items.filter((x) => !!x.file_key);
      default:
        return items;
    }
  }, [items, filter]);

  const doExportPDF = async () => {
    if (!printRef.current) return;
    if (items.length === 0) {
      showToast("ยังไม่มีรายการสำหรับส่งออก", "info");
      return;
    }
    try {
      setExporting(true);
      const node = printRef.current;
      node.classList.remove("hidden");
      node.style.position = "fixed";
      node.style.left = "-10000px";
      node.style.top = "0";
      node.style.width = "794px";
      node.style.background = "#ffffff";
      await new Promise((r) => setTimeout(r, 50));
      const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
      const canvas = await html2canvas(node, { scale, useCORS: true, backgroundColor: "#ffffff", logging: false, windowWidth: 794 });
      node.classList.add("hidden");
      node.removeAttribute("style");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const pageHeightPx = Math.round((imgWidthPx * pageHeight) / pageWidth);

      let positionPx = 0;
      let pageIndex = 0;
      while (positionPx < imgHeightPx) {
        const sliceHeightPx = Math.min(pageHeightPx, imgHeightPx - positionPx);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = imgWidthPx;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, positionPx, imgWidthPx, sliceHeightPx, 0, 0, imgWidthPx, sliceHeightPx);
        const imgData = pageCanvas.toDataURL("image/png");
        const imgHeightMm = (sliceHeightPx * pageWidth) / imgWidthPx;
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeightMm, undefined, "FAST");
        positionPx += sliceHeightPx;
        pageIndex += 1;
      }

      const safeCompany = (profile?.company_name || "OwnerOS").replace(/[^\wก-๙\- ]+/gi, "_");
      pdf.save(`${safeCompany}-Checklist-หมวด${groupNo}-${groupName}-${year}.pdf`);
      showToast("ดาวน์โหลดไฟล์ PDF แล้ว ✅", "success");
    } catch (err) {
      console.error(err);
      showToast("สร้าง PDF ไม่สำเร็จ", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* ✅ Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Checklist", href: "/checklist" },
          { label: `หมวด ${groupNo}: ${groupName}` },
          // { label: String(year) },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold">Checklist หมวด {groupNo}: {groupName}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">ปี:</span>
          <select className="border p-2 rounded-md" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {yearOptions.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
      </div>

      {/* Sticky Summary */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur border rounded-xl p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-[260px]">
            <div className="text-sm text-gray-700 mb-1">ความคืบหน้าหมวดนี้: <span className="font-semibold">{stats.percent}%</span></div>
            <div className="h-2 bg-gray-200 rounded-md overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${stats.percent}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-1">ครบพร้อมไฟล์: {stats.withFile} • ครบยังไม่มีไฟล์: {stats.textOnly} • ยังไม่ทำ: {stats.pending}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "ALL", label: "ทั้งหมด" },
              { key: "PENDING", label: "ยังไม่ทำ" },
              { key: "TEXT_ONLY", label: "ติ๊กแล้วแต่ไม่มีไฟล์" },
              { key: "WITH_FILE", label: "ทำแล้วมีไฟล์" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as Filter)}
                className={`px-3 py-1.5 text-sm rounded-full border ${
                  filter === f.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={doExportPDF}
              disabled={exporting || items.length === 0}
              className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              title="ส่งออกเป็น PDF"
            >
              {exporting ? "กำลังสร้าง PDF..." : "Export PDF"}
            </button>
          </div>
        </div>
      </div>

      {(loading || seeding) && <div className="text-gray-500 text-sm">กำลังเตรียมหัวข้อ…</div>}

      {/* Items */}
      <div className="space-y-4">
        {filteredItems.map((item) => {
          const textLen = editing[item.id]?.trim().length || 0;
          return (
            <div key={item.id} className="bg-white rounded-xl border flex flex-col md:flex-row md:items-start p-4 md:gap-6 shadow-sm">
              <div className="w-full md:w-1/6 text-sm font-medium text-center md:text-left">
                {isComplete(item) ? <span className="text-green-600">✅ ทำแล้ว</span> : <span className="text-yellow-600">⏳ ยังไม่ทำ</span>}
                {item.updated_at && <div className="text-xs text-gray-500 mt-1">อัปเดตล่าสุด: {new Date(item.updated_at).toLocaleString("th-TH")}</div>}
              </div>

              <div className="w-full md:w-4/6">
                <p className="font-semibold text-gray-800 mb-2">{item.display_name}</p>
                <textarea
                  placeholder="เพิ่มคำอธิบาย (อย่างน้อย 100 ตัวอักษร เพื่อถือว่าครบถ้าไม่มีไฟล์)"
                  className="w-full border rounded-md p-2 text-sm"
                  rows={3}
                  value={editing[item.id] ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p, [item.id]: e.target.value }))}
                />
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>ขั้นต่ำ 100 ตัวอักษร</span><span>{textLen}/100</span>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => handleSave(item.id)}
                    disabled={editing[item.id] === item.input_text}
                    className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    บันทึก
                  </button>
                </div>
              </div>

              <div className="w-full md:w-1/6 flex flex-col md:items-end gap-2 mt-3 md:mt-0">
                <label className="text-sm cursor-pointer text-blue-600 flex items-center gap-1">
                  {item.file_key ? "🔁 เปลี่ยนไฟล์" : "📎 แนบไฟล์"}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(item, f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                <div className="text-[11px] text-gray-500">รองรับ .pdf .docx .jpg .png (≤10MB)</div>

                {item.file_key && (
                  <div className="text-xs text-right space-y-2">
                    <div
                      className="text-gray-600 truncate max-w-[220px]"
                      title={prettyFileName(item)}
                    >
                      📄 {prettyFileName(item)}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <a href={item.file_path || "#"} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">🔍 ดูไฟล์แนบ</a>
                      <button onClick={() => handleFileDelete(item)} className="text-red-600 hover:underline" title="ลบไฟล์ออกจากระบบ">🗑️ ลบไฟล์</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {!loading && !seeding && filteredItems.length === 0 && (
          <div className="text-gray-500 text-sm">ยังไม่มีรายการ</div>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* PRINT AREA */}
      <div ref={printRef} className="hidden">
        <div className="w-[794px] bg-white text-gray-900">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            {profile?.company_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.company_logo_url} alt="logo" className="h-10 w-10 object-contain" />
            ) : (<div className="h-10 w-10 rounded bg-gray-200" />)}
            <div>
              <div className="font-bold">{profile?.company_name || "ชื่อบริษัท"} – OwnerOS</div>
              <div className="text-sm">Checklist หมวด {groupNo}: {groupName} • ปี {year}</div>
            </div>
            <div className="ml-auto text-sm text-gray-600">ออกรายงาน: {new Date().toLocaleString("th-TH")}</div>
          </div>

          <div className="px-6 py-3 text-sm">
            <div>ความคืบหน้า: <b>{stats.percent}%</b></div>
            <div className="text-gray-600">ครบพร้อมไฟล์: {stats.withFile} • ครบยังไม่มีไฟล์: {stats.textOnly} • ยังไม่ทำ: {stats.pending}</div>
          </div>

          <div className="px-6">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold border-b py-2">
              <div className="col-span-1">#</div>
              <div className="col-span-4">หัวข้อ</div>
              <div className="col-span-2">สถานะ</div>
              <div className="col-span-3">หมายเหตุ</div>
              <div className="col-span-2">ไฟล์แนบ</div>
            </div>
          </div>

          <div className="px-6">
            {items.map((it, idx) => (
              <div key={it.id} className="grid grid-cols-12 gap-2 text-xs border-b py-2 break-words">
                <div className="col-span-1">{idx + 1}</div>
                <div className="col-span-4">{it.display_name}</div>
                <div className="col-span-2">
                  {it.file_key ? "ทำแล้ว (มีไฟล์)" : (it.input_text?.trim().length || 0) >= 100 ? "ทำแล้ว (ไม่มีไฟล์)" : "ยังไม่ทำ"}
                </div>
                <div className="col-span-3">{truncate(it.input_text || "", 150)}</div>
                <div className="col-span-2">{it.file_key ? prettyFileName(it) : "-"}</div>
              </div>
            ))}
          </div>

          <div className="px-6 py-6 text-xs text-gray-500">รายงานนี้สร้างอัตโนมัติด้วย OwnerOS</div>
        </div>
      </div>
    </div>
  );
}
