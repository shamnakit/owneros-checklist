// pages/modules/[slug].tsx

import Head from "next/head";
import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { track } from "@/lib/analytics/posthog.client";
import { ArrowRight, FileText, Activity, BarChart3, CheckCircle2, Info } from "lucide-react";

/**
 * Next.js (Pages Router)
 * Route: /modules/[slug]  — slug ∈ { iso, lean, kpi }
 * - หน้าอธิบายโมดูลแบบสั้น เพื่อวัดความสนใจ (fundraising)
 * - ใช้ธีมดาร์กให้เข้ากับ landing เดิม
 * - CTA หลัก: "ฉันสนใจ (ฝากคอนแทค)" → ลิงก์ไป /#interest=<slug>
 * - อีเวนต์ที่ยิง: validate_module_view / _cta_interest / _cta_demo
 */

const modules = {
  iso: {
    slug: "iso",
    title: "ISO Readiness (Lite)",
    icon: FileText,
    hero: "Quick Scan 20 ข้อ • Evidence Map • Roadmap 90 วัน",
    summary:
      "เริ่มตรวจความพร้อม ISO 9001/14001 แบบรวดเร็ว เห็นช่องว่าง พร้อมตัวอย่างหลักฐานและแผน 90 วัน",
    bullets: [
      "Quick Scan 20 ข้อ พร้อมคะแนนสี (RAG)",
      "Evidence Map แนบไฟล์/ลิงก์ได้ 5 ช่อง",
      "Roadmap 90 วัน แนะนำ 6 งานหลัก + เจ้าของงาน",
      "Export รายงานย่อ 1 หน้า (PDF)",
    ],
    paywall: [
      "Pre‑audit Checklist เต็ม + Binder (ไม่มีลายน้ำ)",
      "ตัวอย่างเอกสาร/เทมเพลตเพิ่มเติม",
    ],
    faq: [
      { q: "ต้องเริ่มจากอะไร?", a: "ทำ Quick Scan ประเมิน 10–15 นาที แล้วระบบจะแนะนำ Roadmap ให้ทันที" },
      { q: "จำเป็นต้องมีที่ปรึกษาไหม?", a: "ไม่จำเป็นสำหรับ Lite — คุณเริ่มเองได้และค่อยเพิ่มที่ปรึกษาภายหลังหากต้องการ" },
    ],
  },
  lean: {
    slug: "lean",
    title: "Lean 90‑Day (Lite)",
    icon: Activity,
    hero: "Waste Walk • Kaizen Log (10) • Weekly Review 15 นาที",
    summary:
      "ลดความสูญเปล่าเริ่มวันนี้ เก็บ Kaizen สูงสุด 10 รายการ วัดผลก่อน‑หลัง แล้วรีวิวสั้นทุกสัปดาห์",
    bullets: [
      "Waste Walk Template (7 Wastes)",
      "Kaizen Log จำกัด 10 รายการ (ก่อน‑หลัง)",
      "Weekly Review 15 นาที พร้อม Owner",
      "Metric Before/After 3 ตัว (เช่น Cycle/Defect/Rework)",
    ],
    paywall: [
      "Kaizen ไม่จำกัด + CAPA/NCR (เบื้องต้น)",
      "Value Stream Map (เร็ว ๆ นี้)",
    ],
    faq: [
      { q: "ใช้กับทีมเล็กได้ไหม?", a: "ได้ เหมาะมากสำหรับทีม 5–20 คนที่เริ่มทำ Lean ครั้งแรก" },
      { q: "ต้องเชื่อม ERP ไหม?", a: "ไม่จำเป็น เริ่มจากกรอก/CSV/Sheets ได้เลย" },
    ],
  },
  kpi: {
    slug: "kpi",
    title: "KPI Suite (River KPI + Execution Lite)",
    icon: BarChart3,
    hero: "เทรนด์ 12 เดือน • anomaly highlight • Check‑in รายสัปดาห์",
    summary:
      "เห็นเทรนด์ตัวจริงย้อนหลังยาว ๆ พร้อมชี้จุดผิดปกติ และเช็คอินทีมสั้น ๆ รายสัปดาห์",
    bullets: [
      "อัปโหลด CSV/เชื่อม Google Sheets",
      "River KPI (เทรนด์ 12 เดือน + anomaly)",
      "Execution Lite: ตั้ง KPI 4 ตัว + Owner + Weekly Check‑in",
      "แจ้งเตือนเมื่อค่าหลุดกรอบ",
    ],
    paywall: [
      "Scenario/What‑if + Forecast ถึงเส้นตาย",
      "ตัวชี้วัดไม่จำกัด + Export เต็ม",
    ],
    faq: [
      { q: "ต้องการข้อมูลประเภทไหน?", a: "เริ่มจากไฟล์ CSV 2 คอลัมน์ (วันที่, ค่า) หรือเชื่อม Google Sheets ก็ได้" },
      { q: "ดูบนมือถือได้ไหม?", a: "ได้ หน้า River ปรับแต่งสำหรับมือถือ เปิดดูเช้า ๆ ไม่ถึง 30 วิ" },
    ],
  },
} as const;

type Slug = keyof typeof modules;

export default function ModuleDetail() {
  const router = useRouter();
  const { slug } = router.query as { slug?: Slug };
  const data = slug ? modules[slug] : null;

  useEffect(() => {
    if (!slug) return;
    track("validate_module_view", { slug });
  }, [slug]);

  if (!data) return null;
  const Icon = data.icon;

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <Head>
        <title>{`${data.title} – Bizzyztem`}</title>
        <meta name="description" content={data.summary} />
      </Head>

      {/* Header (ย่อ) */}
      <header className="sticky top-0 z-40 bg-[#0B1220]/80 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2 text-white/90">
            <span className="font-semibold tracking-tight">Bizzyztem</span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">Modules</span>
          </a>
          <a
            href={`/#interest=${data.slug}`}
            onClick={() => track("validate_module_cta_interest", { slug: data.slug })}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
          >
            ฉันสนใจ (ฝากคอนแทค) <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="py-10 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1 text-sm">
              <Icon className="h-4 w-4" /> <span>{data.title}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{data.hero}</h1>
            <p className="text-white/80">{data.summary}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={`/#interest=${data.slug}`}
                onClick={() => track("validate_module_cta_interest", { slug: data.slug })}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2 text-white hover:bg-brand-700"
              >
                ฉันสนใจ (ฝากคอนแทค) <ArrowRight className="h-4 w-4" />
              </a>
              <button
                onClick={() => track("validate_module_cta_demo", { slug: data.slug })}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/0 px-5 py-2 hover:bg-white/10"
              >
                ดูตัวอย่างสั้น
              </button>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-white/60">
              <Info className="h-3.5 w-3.5" /> ตัวชี้วัดจากหน้านี้จะถูกรวบรวม (anonymized) เพื่อประกอบการระดมทุน
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-sm h-64 grid place-items-center text-white/70">
            ตัวอย่างหน้าจอ/ไดอะแกรม (ใส่ภาพจริงทีหลัง)
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          {data.bullets.map((b, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand-400" />
                <div className="text-white/90 text-sm">{b}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Paywall preview */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
            <div className="text-sm text-white/70 mb-2">สิ่งที่จะปลดล็อกเมื่ออัปเกรด</div>
            <ul className="grid md:grid-cols-2 gap-3 text-sm text-white/90">
              {data.paywall.map((p, i) => (
                <li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-brand-400 mt-0.5" /> {p}</li>
              ))}
            </ul>
            <div className="mt-4">
              <a
                href={`/#interest=${data.slug}`}
                onClick={() => track("validate_module_cta_interest", { slug: data.slug })}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
              >ฉันสนใจ (ฝากคอนแทค) <ArrowRight className="h-4 w-4" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-xl font-semibold mb-4">คำถามที่พบบ่อย</h3>
          <div className="divide-y divide-white/10">
            {data.faq.map((f, i) => (
              <details key={i} className="group py-4">
                <summary className="cursor-pointer list-none flex items-center justify-between text-white font-medium">
                  {f.q}
                  <span className="transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <p className="mt-2 text-white/80 text-sm">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 border-t border-white/10 bg-gradient-to-br from-[#0B1220] to-[#0E1A2F]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h4 className="text-2xl font-bold mb-2">สนใจ {data.title}?</h4>
          <p className="text-white/70 mb-6">กรอกคอนแทค แล้วเข้าร่วมรอบทดสอบหรือรับข่าวเมื่อพร้อมใช้งาน</p>
          <a
            href={`/#interest=${data.slug}`}
            onClick={() => track("validate_module_cta_interest", { slug: data.slug })}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-white text-base font-medium shadow-sm hover:bg-brand-700"
          >
            ฉันสนใจ (ฝากคอนแทค) <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>
    </div>
  );
}
