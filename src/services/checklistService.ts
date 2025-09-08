// src/services/checklistService.ts
import { supabase } from "@/utils/supabaseClient";

/** ---------- Types & Utils ---------- */
export type CategoryKey =
  | "strategy"
  | "structure"
  | "sop"
  | "hr"
  | "finance"
  | "sales";

export interface ChecklistRow {
  template_id: string;
  name: string;
  score_points: number;
  has_record: boolean;
  has_evidence: boolean;
  updated_at: string | null;
  input_text: string | null;
  file_key: string | null;
  file_path: string | null;
  // จาก checklist_templates (สำหรับ Guideline/Example)
  guideline?: string | null;
  example?: string | null;
}

// alias ให้ของเดิมทำงานต่อได้
export type ChecklistItem = ChecklistRow;

export interface Summary {
  pct: number;
  total: number;
  scored: number;
  completed: number;
  checkedNoFile: number;
  notStarted: number;
  withFile: number;
}

function groupNameForCategory(c: CategoryKey | string): string {
  switch (c) {
    case "strategy":
      return "Strategy";
    case "structure":
      return "Structure";
    case "sop":
      return "SOP";
    case "hr":
      return "HR";
    case "finance":
      return "Finance";
    case "sales":
      return "Sales";
    default:
      return "General";
  }
}

/** ---------- Helpers (pure) ---------- */
export function getStatus(
  it: Pick<ChecklistRow, "has_record" | "has_evidence">
) {
  if (!it.has_record) return "red" as const;
  if (it.has_record && !it.has_evidence) return "yellow" as const;
  return "green" as const;
}

export function calcSummary(
  items: ChecklistRow[],
  requireEvidence: boolean
): Summary {
  const total = items.reduce((s, it) => s + Number(it.score_points || 0), 0);
  const scored = items
    .filter((it) =>
      requireEvidence ? it.has_record && it.has_evidence : it.has_record
    )
    .reduce((s, it) => s + Number(it.score_points || 0), 0);
  const pct = total > 0 ? Math.round((scored / total) * 100) : 0;
  const completed = items.filter((it) => it.has_record && it.has_evidence)
    .length;
  const checkedNoFile = items.filter((it) => it.has_record && !it.has_evidence)
    .length;
  const notStarted = items.filter((it) => !it.has_record).length;
  const withFile = items.filter((it) => it.has_evidence).length;
  return { pct, total, scored, completed, checkedNoFile, notStarted, withFile };
}

export function fmtDate(s?: string | null) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

/** ---------- Auth ---------- */
export async function getAuthUid() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id)
    throw new Error("ไม่พบผู้ใช้ (auth.uid) — โปรดล็อกอิน");
  return data.user.id as string;
}

/** ---------- Read (years, items, templates) ---------- */
export async function listYears(): Promise<number[]> {
  const { data, error } = await supabase.rpc("fn_available_years_for_me");
  if (error) throw error;
  const ys = (data as any[])
    .map((r) => Number((r as any).year_version))
    .filter(Boolean);
  return ys.length ? ys : [new Date().getFullYear()];
}

// ดึง template ต่อหมวด (ใช้ Guideline/Example)
export async function fetchChecklistTemplatesByCategory(
  category: CategoryKey
): Promise<ChecklistRow[]> {
  const { data, error } = await supabase
    .from("checklist_templates")
    .select("id, name, guideline, example, score_points, order_no")
    .eq("category", category)
    .eq("is_active", true)
    .order("order_no", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    template_id: r.id,
    name: r.name,
    score_points: Number(r.score_points ?? 1),
    has_record: false,
    has_evidence: false,
    updated_at: null,
    input_text: null,
    file_key: null,
    file_path: null,
    guideline: r.guideline ?? null,
    example: r.example ?? null,
  })) as ChecklistRow[];
}

// โหลดสถานะของผู้ใช้ (RPC)
export async function loadItems(params: {
  year: number;
  category: CategoryKey;
}): Promise<ChecklistRow[]> {
  const { year, category } = params;
  const { data, error } = await supabase.rpc("fn_checklist_items_for_me", {
    p_year: year,
    p_category: category,
  });
  if (error) throw error;

  const rows = ((data || []) as ChecklistRow[]).sort((a, b) => {
    const ta = (a.template_id || "").toString();
    const tb = (b.template_id || "").toString();
    if (ta < tb) return -1;
    if (ta > tb) return 1;
    const na = (a.name || "").toString().toLowerCase();
    const nb = (b.name || "").toString().toLowerCase();
    return na.localeCompare(nb);
  });
  return rows;
}

/** ---------- Mutations (record) ---------- */
export async function ensureRow(payload: {
  uid?: string;
  template_id: string;
  year: number;
  name: string;
  autoCheck?: boolean;
}): Promise<void> {
  const uid = payload.uid ?? (await getAuthUid());
  const autoCheck = payload.autoCheck ?? true;
  const { error } = await supabase
    .from("checklists_v2")
    .upsert(
      [
        {
          user_id: uid,
          template_id: payload.template_id,
          year_version: payload.year,
          name: payload.name,
          ...(autoCheck ? { has_record: true } : {}),
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "user_id,template_id,year_version" }
    );
  if (error) throw error;
}

export async function toggleRecord(payload: {
  template_id: string;
  year: number;
  name: string;
  next: boolean;
}): Promise<void> {
  const uid = await getAuthUid();
  if (payload.next) {
    await ensureRow({
      uid,
      template_id: payload.template_id,
      year: payload.year,
      name: payload.name,
      autoCheck: true,
    });
  } else {
    const { error } = await supabase
      .from("checklists_v2")
      .delete()
      .eq("user_id", uid)
      .eq("template_id", payload.template_id)
      .eq("year_version", payload.year);
    if (error) throw error;
  }
}

export async function saveText(payload: {
  template_id: string;
  year: number;
  name: string;
  text: string;
}): Promise<void> {
  const uid = await getAuthUid();
  await ensureRow({
    uid,
    template_id: payload.template_id,
    year: payload.year,
    name: payload.name,
    autoCheck: true,
  });
  const { error } = await supabase
    .from("checklists_v2")
    .update({
      input_text: payload.text.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", uid)
    .eq("template_id", payload.template_id)
    .eq("year_version", payload.year);
  if (error) throw error;
}

/** ---------- Storage (upload/replace/remove/view) ---------- */
const DEFAULT_BUCKET = "evidence";

export async function uploadEvidence(payload: {
  template_id: string;
  year: number;
  name: string;
  file: File;
  bucket?: string;
}): Promise<{ key: string; fileName: string }> {
  const uid = await getAuthUid();
  await ensureRow({
    uid,
    template_id: payload.template_id,
    year: payload.year,
    name: payload.name,
    autoCheck: true,
  });

  const bucket = payload.bucket ?? DEFAULT_BUCKET;
  const ext = payload.file.name.split(".").pop() || "bin";
  const key = `${uid}/${payload.year}/${payload.template_id}/${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(key, payload.file, {
      cacheControl: "3600",
      upsert: false,
      contentType: payload.file.type || undefined,
    });
  if (upErr) throw upErr;

  const { error: updErr } = await supabase
    .from("checklists_v2")
    .update({
      file_key: key,
      file_path: payload.file.name,
      has_evidence: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", uid)
    .eq("template_id", payload.template_id)
    .eq("year_version", payload.year);
  if (updErr) throw updErr;

  return { key, fileName: payload.file.name };
}

export async function replaceEvidence(payload: {
  template_id: string;
  year: number;
  name: string;
  file: File;
  oldKey?: string | null;
  bucket?: string;
}): Promise<{ key: string; fileName: string }> {
  const bucket = payload.bucket ?? DEFAULT_BUCKET;

  if (payload.oldKey) {
    await supabase.storage
      .from(bucket)
      .remove([payload.oldKey])
      .catch((e) => {
        console.warn("remove old file failed (continue):", e?.message || e);
      });
  }
  return uploadEvidence({
    template_id: payload.template_id,
    year: payload.year,
    name: payload.name,
    file: payload.file,
    bucket,
  });
}

export async function removeEvidence(payload: {
  template_id: string;
  year: number;
  key: string;
  bucket?: string;
}): Promise<void> {
  const uid = await getAuthUid();
  const bucket = payload.bucket ?? DEFAULT_BUCKET;

  const { error: delErr } = await supabase.storage
    .from(bucket)
    .remove([payload.key]);
  if (delErr) throw delErr;

  const { error: updErr } = await supabase
    .from("checklists_v2")
    .update({
      has_evidence: false,
      file_key: null,
      file_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", uid)
    .eq("template_id", payload.template_id)
    .eq("year_version", payload.year);
  if (updErr) throw updErr;
}

export async function signedUrl(payload: {
  key: string;
  bucket?: string;
  expiresInSec?: number;
}): Promise<string> {
  const bucket = payload.bucket ?? DEFAULT_BUCKET;
  const expiresInSec = payload.expiresInSec ?? 60 * 5;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(payload.key, expiresInSec, { download: false });
  if (error || !data?.signedUrl) throw error || new Error("no signed url");
  return data.signedUrl;
}

/** ---------- Admin: checklist_templates helper ---------- */
export type TemplateRow = {
  id?: string;
  template_id?: string | null;
  name: string;
  description?: string | null;
  category: CategoryKey;
  group_name?: string | null;
  score_points: number;
  order_no?: number | null;
  is_active?: boolean;
  guideline?: string | null;
  example?: string | null;
};

// ให้ admin.tsx import ได้
export type Checklist = TemplateRow & { title?: string };

type AdminChecklistInput = Partial<TemplateRow> & {
  title?: string;
  description?: string;
};

export async function getChecklists(): Promise<Checklist[]> {
  const { data, error } = await supabase
    .from("checklist_templates")
    .select("*")
    .order("category", { ascending: true })
    .order("order_no", { ascending: true });
  if (error) throw error;
  return (data || []).map((r: any) => ({ ...r, title: r.name })) as Checklist[];
}

export async function createChecklist(
  payload: AdminChecklistInput
): Promise<Checklist> {
  const cat = (payload.category ?? "strategy") as CategoryKey;
  const row: TemplateRow = {
    name: (payload.title ?? payload.name ?? "").toString(),
    description: payload.description ?? null,
    category: cat,
    group_name: payload.group_name ?? groupNameForCategory(cat),
    score_points: Number(payload.score_points ?? 1),
    order_no: payload.order_no ?? null,
    is_active: payload.is_active ?? true,
    template_id: payload.template_id ?? null,
    guideline: payload.guideline ?? null,
    example: payload.example ?? null,
  };
  const { data, error } = await supabase
    .from("checklist_templates")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  const created = data as TemplateRow;
  return { ...created, title: created.name };
}

export async function updateChecklist(
  id: string,
  patch: Partial<AdminChecklistInput>
): Promise<void> {
  const upd: any = { ...patch };
  if (upd.title != null) {
    upd.name = upd.title;
    delete upd.title;
  }
  if (upd.score_points != null) upd.score_points = Number(upd.score_points);
  if (upd.category != null && (upd.group_name == null || upd.group_name === "")) {
    upd.group_name = groupNameForCategory(upd.category);
  }

  const { error } = await supabase
    .from("checklist_templates")
    .update(upd)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteChecklist(id: string): Promise<void> {
  const { error } = await supabase
    .from("checklist_templates")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
