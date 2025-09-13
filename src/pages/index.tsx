import React from "react";
import { Activity, BarChart3, BellRing, CheckCircle2, FileText, Gauge, Goal, LineChart, Lock, Mail, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";

/**
 * Bizzyztem — Landing Page (TH • Tailwind-only • Corporate Navy)
 * - CEO-first
 * - Core ฟรี + โมดูลเสริมแบบ Odoo-style
 * - เพิ่มส่วน "โมดูลที่กำลังสำรวจดีมานด์ (ISO • Lean • KPI)" เพื่อวัดความสนใจ
 * - มีแบบฟอร์ม "ฝากคอนแทค" ในหน้าเดียว และยิง event ไปยัง window.posthog (ถ้ามี)
 */

export default function LandingPageTH_TailwindOnly() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-slate-50 text-slate-900">
      <NavBar />
      <Hero />
      <ValueCards />
      <HowItWorks />
      <ScreenshotBlock />
      <ValidationModules />
      <InterestForm />
      <Pricing />
      <SocialProof />
      <Outcomes />
      <FitSection />
      <Integrations />
      <Support />
      <Security />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}

/* --------------------------------------------------------- */
/* Base primitives (Tailwind only)                           */
/* --------------------------------------------------------- */
const Container: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = "" }) => (
  <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
);

const ButtonLink: React.FC<{ href: string; children: React.ReactNode; variant?: "primary" | "outline" | "secondary"; className?: string; }>
= ({ href, children, variant = "primary", className = "" }) => {
  const style =
    variant === "primary"
      ? "bg-blue-700 hover:bg-blue-800 text-white"
      : variant === "secondary"
      ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
      : "border border-slate-300 hover:bg-slate-50 text-slate-700";
  return (
    <a href={href} className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${style} ${className}`}>
      {children}
    </a>
  );
};

const Badge: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = "" }) => (
  <span className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 ${className}`}>{children}</span>
);

const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = "" }) => (
  <div className={`rounded-2xl border bg-white shadow-sm ${className}`}>{children}</div>
);

/* ใช้ <details> แทน Accordion JS */
const QA: React.FC<{ q: string; a: string }>= ({ q, a }) => (
  <details className="group rounded-2xl border bg-white p-4 open:shadow-sm">
    <summary className="cursor-pointer list-none font-medium text-slate-900 flex items-center justify-between">
      {q}
      <span className="ml-4 text-slate-400 group-open:rotate-180 transition-transform">▾</span>
    </summary>
    <div className="mt-2 text-slate-600">{a}</div>
  </details>
);

/* --------------------------------------------------------- */
/* Sections                                                   */
/* --------------------------------------------------------- */
function NavBar() {
  return (
    <div className="sticky top-0 z-40 w-full backdrop-blur bg-white/70 border-b border-slate-200">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-700" />
          <span className="font-semibold tracking-tight">Bizzyztem</span>
          <Badge className="ml-2 hidden md:inline-flex">CEO‑first</Badge>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <a href="#product" className="hover:text-slate-900">ผลิตภัณฑ์</a>
          <a href="#pricing" className="hover:text-slate-900">ราคา</a>
          <a href="#security" className="hover:text-slate-900">ความปลอดภัย</a>
          <a href="#help" className="hover:text-slate-900">ศูนย์ช่วยเหลือ</a>
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="#signin" variant="outline" className="hidden sm:inline-flex">เข้าสู่ระบบ</ButtonLink>
          <ButtonLink href="#signup">เริ่มทดลอง 30 วันฟรี</ButtonLink>
        </div>
      </Container>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative py-16 md:py-24">
      <Container className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900">เห็นภาพรวมทั้งบริษัทแบบเรียลไทม์ — รู้ว่าใกล้เป้าหมายแค่ไหน</h1>
          <p className="mt-4 text-slate-600 text-lg">แผงควบคุมสำหรับผู้บริหาร: การ์ด 6 KPI + พยากรณ์ถึงเส้นตาย + รายงานสถานะธุรกิจวันนี้ (อัตโนมัติทุกเช้า)</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink href="#signup">เริ่มทดลองใช้งานฟรี 30 วัน</ButtonLink>
            <ButtonLink href="#demo" variant="outline">ดูตัวอย่าง 2 นาที</ButtonLink>
          </div>
          <p className="mt-3 text-sm text-slate-500">เปิดดูได้ในไม่ถึง 30 วินาที • ใช้ทุกวัน 2–5 นาที</p>
        </div>
        <HeroPreview />
      </Container>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
        <div className="grid grid-cols-2 gap-4">
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} title="Revenue MTD" value="฿1,245,000" trend="▲ 6%" status="ดี" />
          <KpiCard icon={<BarChart3 className="h-4 w-4" />} title="GP%" value="28.4%" trend="▼ 1.2pp" status="เฝ้าระวัง" />
          <KpiCard icon={<Gauge className="h-4 w-4" />} title="Cash Days" value="52" trend="=" status="ดี" />
          <KpiCard icon={<Activity className="h-4 w-4" />} title="AR > 30" value="14%" trend="▼ 2%" status="ดี" />
          <KpiCard icon={<LineChart className="h-4 w-4" />} title="Win Rate" value="31%" trend="▲ 3%" status="ดี" />
          <KpiCard icon={<CheckCircle2 className="h-4 w-4" />} title="OTIF" value="95%" trend="=" status="ดี" />
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <BellRing className="h-4 w-4 text-amber-600" />
            <span>แจ้งเตือน: GP% ต่ำกว่าเป้า 2 จุด • แนะนำกด Reforecast</span>
          </div>
          <ButtonLink href="#reforecast" variant="secondary" className="px-3 py-1.5">Reforecast</ButtonLink>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, title, value, trend, status }: { icon: React.ReactNode; title: string; value: string; trend: string; status: string; }) {
  return (
    <Card>
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="text-sm font-medium text-slate-600 flex items-center gap-2">{icon}{title}</div>
        <Badge>{status}</Badge>
      </div>
      <div className="px-4 pb-4">
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-xs text-slate-500 mt-1">{trend}</div>
      </div>
    </Card>
  );
}

function SectionHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      {eyebrow && <div className="text-xs uppercase tracking-widest text-blue-700 mb-2">{eyebrow}</div>}
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
      {sub && <p className="mt-2 text-slate-600">{sub}</p>}
    </div>
  );
}

function ValueCards() {
  const items = [
    { icon: <TrendingUp className="h-5 w-5" />, title: "รูปสถานะแบบเรียลไทม์", text: "Revenue MTD, GP%, Cash Days, AR>30 พร้อมไฟจราจรและการแจ้งเตือน" },
    { icon: <Users className="h-5 w-5" />, title: "มอนิเตอร์ทุกแผนก", text: "Sales / Operations / Finance / HR — สรุปแผนกละ 1–2 KPI เห็นคอขวดทันที" },
    { icon: <Goal className="h-5 w-5" />, title: "ถึงเป้าหรือยัง?", text: "เกจสถานะ + พยากรณ์ถึงเส้นตาย + ผู้ช่วยปรับแผน (Reforecast)" },
  ];
  return (
    <section id="product" className="py-14 md:py-20">
      <Container>
        <SectionHeader title="คุณค่าหลัก ที่ CEO ต้องได้" sub="เรียบ ง่าย เห็นภาพรวม ตัดสินใจไว ใช้ทุกวัน 2–5 นาที" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((it) => (
            <Card key={it.title}>
              <div className="p-4">
                <div className="flex items-center gap-2 text-blue-700"><span>{it.icon}</span><span className="font-medium">{it.title}</span></div>
                <p className="mt-3 text-slate-600">{it.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { title: "รายงานสถานะธุรกิจวันนี้", desc: "ดูตัวเลขสำคัญ + แจ้งเตือนสิ่งผิดปกติ ส่งอัตโนมัติทุกเช้า", icon: Mail },
    { title: "หน้าควบคุมหลัก", desc: "การ์ด 6 KPI + มุมมองตามแผนก + เทรนด์ช่วงสั้น", icon: BarChart3 },
    { title: "ตัดสินใจ & แจ้งทีม", desc: "ปุ่มเดียว: Re‑plan / Re‑target / Re‑focus หรือส่งโน้ตถึงทีม", icon: CheckCircle2 },
  ];
  return (
    <section className="py-14 md:py-20">
      <Container>
        <SectionHeader title="ใช้อย่างไร (3 ขั้น)" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s, idx) => (
            <Card key={s.title}>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><s.icon className="h-5 w-5" /></div>
                  <div className="font-medium">{idx + 1}) {s.title}</div>
                </div>
                <p className="mt-3 text-slate-600">{s.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ScreenshotBlock() {
  return (
    <section className="py-10 md:py-16">
      <Container>
        <Card>
          <div className="grid md:grid-cols-2 gap-6 items-center p-6 md:p-10">
            <div>
              <SectionHeader title="ภาพรวมวันนี้ • ไฟจราจร • พยากรณ์" sub="เปิดดูได้ในไม่ถึง 30 วินาที — เหมาะกับการใช้งานบนมือถือ" />
              <div className="mt-6 flex gap-3">
                <ButtonLink href="#signup">เริ่มทดลอง 30 วันฟรี</ButtonLink>
                <ButtonLink href="#demo" variant="outline">ดูตัวอย่าง 2 นาที</ButtonLink>
              </div>
            </div>
            <div className="h-64 md:h-72 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border flex items-center justify-center text-slate-500">ตัวอย่างหน้าจอ Mission Control</div>
          </div>
        </Card>
      </Container>
    </section>
  );
}

/* ------------------------ Validation Cards + Form ------------------------ */
function ValidationModules() {
  const modules = [
    { slug: "iso", title: "ISO Readiness (Lite)", desc: "Quick Scan 20 ข้อ • Evidence Map • Roadmap 90 วัน", icon: FileText, href: "/modules/iso" },
    { slug: "lean", title: "Lean 90-Day (Lite)", desc: "Waste Walk • Kaizen Log (10 รายการ) • Weekly Review 15 นาที", icon: Activity, href: "/modules/lean" },
    { slug: "kpi", title: "KPI Suite (River KPI + Execution Lite)", desc: "เทรนด์ 12 เดือน • anomaly highlight • Check-in รายสัปดาห์", icon: BarChart3, href: "/modules/kpi" },
  ] as const;

  const handleDetails = (slug: string) => {
    (window as any)?.posthog?.capture?.("validate_card_click_details", { slug });
  };
  const handleInterest = (slug: string) => {
    (window as any)?.posthog?.capture?.("validate_interest_click", { slug });
    if (typeof window !== "undefined") {
      window.location.hash = `interest=${slug}`;
      document.getElementById("interest")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-14 md:py-20">
      <Container>
        <SectionHeader eyebrow="Validation for Fundraising" title="โมดูลที่กำลังสำรวจดีมานด์ (ISO • Lean • KPI)" sub="เราวัดทั้งการกดดูรายละเอียดและการฝากคอนแทค เพื่อใช้เป็นหลักฐานในการระดมทุน" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {modules.map((m) => (
            <div key={m.slug} className="rounded-2xl border bg-white shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{m.title}</div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{m.desc}</p>
              <div className="mt-4 flex items-center gap-3">
                <a href={m.href} onClick={() => handleDetails(m.slug)} className="inline-flex items-center rounded-2xl px-3 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 text-slate-700">ดูรายละเอียด</a>
                <button onClick={() => handleInterest(m.slug)} className="inline-flex items-center rounded-2xl px-3 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white">ฉันสนใจ (ฝากคอนแทค)</button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">*ตัวชี้วัดบนหน้านี้จะถูกรวบรวมเป็นข้อมูลประกอบการระดมทุน (anonymized)</p>
      </Container>
    </section>
  );
}

function InterestForm() {
  const [module, setModule] = React.useState<string>("");
  const [name, setName] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const match = window.location.hash.match(/interest=(\w+)/);
    if (match) setModule(match[1]);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    (window as any)?.posthog?.capture?.("validate_interest_submit", { module, name, company, contact });
    alert("ขอบคุณที่สนใจ เราจะติดต่อกลับโดยเร็วที่สุด");
  };

  return (
    <section id="interest" className="py-10 md:py-16">
      <Container>
        <SectionHeader title="ฝากคอนแทคสำหรับโมดูลที่สนใจ" sub="กรอกข้อมูลสั้น ๆ เพื่อติดต่อรับข่าวเมื่อโมดูลพร้อม หรือเข้าร่วมรอบทดสอบ" />
        <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">โมดูลที่สนใจ</label>
            <select value={module} onChange={(e) => setModule(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
              <option value="">เลือกโมดูล</option>
              <option value="iso">ISO Readiness (Lite)</option>
              <option value="lean">Lean 90-Day (Lite)</option>
              <option value="kpi">KPI Suite (River KPI + Execution Lite)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">ชื่อ‑สกุล</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">บริษัท</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">เบอร์/อีเมลสำหรับติดต่อกลับ</label>
            <input value={contact} onChange={(e) => setContact(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">หมายเหตุ (ถ้ามี)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="w-full rounded-2xl bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 font-medium">ส่งข้อมูลความสนใจ</button>
            <p className="mt-2 text-xs text-slate-500 text-center">กดส่ง = ยินยอมให้ Bizzyztem ติดต่อกลับ และรับอัปเดตความคืบหน้าโมดูล</p>
          </div>
        </form>
      </Container>
    </section>
  );
}

/* ------------------------ Pricing & Rest ------------------------ */
function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-white">
      <Container>
        <SectionHeader title="ราคา (เรียบ เข้าใจง่าย)" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <PriceCard title="Core (ฟรี)" price="฿0" audience="เริ่มต้น/ทดสอบ" features={["การ์ด KPI 2 ใบ", "การเตือนพื้นฐาน", "รายงานสถานะธุรกิจวันนี้ (พื้นฐาน)", "Export ฉบับย่อ 1 ครั้ง/เดือน"]} cta={{ href: "#signup", label: "เริ่มฟรี" }} />
          <PriceCard title="โมดูลเสริม (เริ่มต้น)" price="ตามโมดูล" audience="ซื้อเฉพาะความสามารถที่ต้องใช้" highlight features={["River KPI / Goal / Decision Inbox Pro", "Audit Binder+ / Board Pack Pro", "Realtime Connectors / Digital Assets", "ISO Readiness / Lean / ESG/Carbon"]} cta={{ href: "#modules", label: "ดูโมดูลที่มี" }} />
          <PriceCard title="Bundles" price="ประหยัด 20–30%" audience="รวมโมดูลยอดนิยม" features={["Owner Growth", "Operational Excellence", "Governance", "Sustainability Lite"]} cta={{ href: "#modules", label: "รับข้อเสนอ" }} />
        </div>
        <p className="text-center text-sm text-slate-500 mt-4">ทดลองใช้โมดูลฟรี 14 วัน (เมื่อพร้อม) • เก็บสถิติวัดดีมานด์เพื่อใช้ประกอบการระดมทุน</p>
      </Container>
    </section>
  );
}

function PriceCard({ title, price, audience, features, cta, highlight }: { title: string; price: string; audience: string; features: string[]; cta: { href: string; label: string }; highlight?: boolean; }) {
  return (
    <Card className={`${highlight ? "ring-2 ring-blue-700" : ""}`}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold">{title}</div>
          {highlight && <Badge>ยอดนิยม</Badge>}
        </div>
        <div className="mt-2 text-3xl font-semibold">{price}</div>
        <p className="text-slate-500 text-sm">{audience}</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-blue-700 mt-0.5" /><span>{f}</span></li>
          ))}
        </ul>
        <ButtonLink href={cta.href} className="w-full mt-6">{cta.label}</ButtonLink>
      </div>
    </Card>
  );
}

function SocialProof() {
  return (
    <section className="py-14 md:py-20">
      <Container>
        <SectionHeader title="สังคมพิสูจน์" sub="โลโก้ผู้ใช้งานกลุ่มแรก + เสียงจากผู้ใช้จริง (สั้น ๆ)" />
        <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100 border" />
          ))}
        </div>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            "เปิดดูบนมือถือทุกเช้า ไม่ถึง 30 วิ ก็รู้ว่าแดงตรงไหน — เจ้าของธุรกิจบริการ",
            "รีวิวสัปดาห์ละ 15 นาที ทีมโฟกัสมากขึ้น — ผู้บริหารระดับกลาง",
            "ส่งรายงานให้ลูกค้าได้ในคลิกเดียว — เอเจนซี่",
          ].map((q, idx) => (
            <Card key={idx}><div className="p-4 text-slate-700">“{q}”</div></Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Outcomes() {
  const items = [
    { icon: FileText, text: "ได้ Binder พร้อมยื่นภายใน 14 วัน" },
    { icon: CheckCircle2, text: "ลดเวลาประชุมสรุปเหลือ ~15 นาที/สัปดาห์" },
    { icon: Gauge, text: "เห็น KPI หลักบนมือถือใน < 30 วินาที ทุกเช้า" },
  ];
  return (
    <section className="py-14 md:py-20">
      <Container>
        <SectionHeader title="ผลลัพธ์ที่มุ่งหวัง" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((it) => (
            <Card key={it.text}><div className="flex items-center gap-3 p-4"><div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><it.icon className="h-5 w-5" /></div><div className="font-medium">{it.text}</div></div></Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FitSection() {
  return (
    <section className="py-14 md:py-20">
      <Container>
        <SectionHeader title="เหมาะกับใคร / ไม่เหมาะกับใคร" />
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <Card><div className="p-5"><div className="font-semibold mb-2">เหมาะกับ</div><div className="text-slate-600 space-y-2 text-sm"><p>เจ้าของ/CEO ที่ต้องการภาพรวมเร็ว ตัดสินใจไว ใช้เวลา 2–5 นาที/วัน</p><p>ทีม S/M ที่อยากเริ่มจาก CSV/Sheets ก่อน เชื่อม ERP/บัญชีภายหลัง</p></div></div></Card>
          <Card><div className="p-5"><div className="font-semibold mb-2">ไม่เหมาะกับ</div><div className="text-slate-600 space-y-2 text-sm"><p>ทีมที่ต้องการระบบจัดคิวงานรายคนละเอียดระดับงานย่อย (ควรใช้ Asana/Jira คู่กัน)</p></div></div></Card>
        </div>
      </Container>
    </section>
  );
}

function Integrations() {
  return (
    <section className="py-14 md:py-20">
      <Container>
        <SectionHeader title="การเชื่อมต่อ & ข้อมูล" sub="เริ่มได้ทันทีด้วยกรอก/CSV/Google Sheets — เชื่อมต่อ ERP/บัญชี/CRM ได้ภายหลัง" />
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {["CSV", "Google Sheets", "ERP/บัญชี/CRM (เร็ว ๆ นี้)"].map((name) => (
            <Card key={name}><div className="p-6 text-slate-700">{name}</div></Card>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">ข้อมูลเป็นของคุณ — ดาวน์โหลด/Export ได้ตลอดเวลา (PDF/DOCX/XLSX/CSV)</p>
      </Container>
    </section>
  );
}

function Support() {
  return (
    <section id="help" className="py-14 md:py-20">
      <Container>
        <SectionHeader title="การสนับสนุน" />
        <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm text-slate-600">
          <Card><div className="p-6">ศูนย์ช่วยเหลือ (บทความ/วิดีโอสั้น)</div></Card>
          <Card><div className="p-6">อีเมล/แชท • LINE OA</div></Card>
          <Card><div className="p-6">Office Hours รายเดือน</div></Card>
        </div>
      </Container>
    </section>
  );
}

function Security() {
  return (
    <section id="security" className="py-14 md:py-20 bg-white">
      <Container>
        <SectionHeader title="ความปลอดภัย & ความน่าเชื่อถือ" />
        <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm text-slate-700">
          <div className="rounded-2xl border bg-slate-50 p-5"><ShieldCheck className="h-5 w-5 text-emerald-600 mb-2" />สิทธิ์ตามบทบาท (RBAC) • บันทึกกิจกรรม • การอนุมัติเอกสาร</div>
          <div className="rounded-2xl border bg-slate-50 p-5"><Lock className="h-5 w-5 text-blue-700 mb-2" />เข้ารหัสระหว่างทาง/ขณะพัก • สำรองข้อมูล • ควบคุมการแชร์รายงาน (ลายน้ำ/วันหมดอายุลิงก์)</div>
          <div className="rounded-2xl border bg-slate-50 p-5"><FileText className="h-5 w-5 text-sky-600 mb-2" />สอดคล้อง PDPA เบื้องต้น • ผู้ใช้ควบคุมสิทธิ์การเข้าถึงข้อมูล</div>
        </div>
      </Container>
    </section>
  );
}

function FAQ() {
  const qa = [
    { q: "ทดลองใช้งานทำอย่างไร?", a: "เปิดครบทุกฟีเจอร์ 30 วัน หลังครบกำหนดระบบจะลดเป็นแผนฟรีโดยอัตโนมัติ" },
    { q: "ต้องเชื่อม ERP ก่อนหรือไม่?", a: "ไม่จำเป็น เริ่มจากกรอก/CSV/Sheets ได้ แล้วค่อยเชื่อมภายหลัง" },
    { q: "เหมาะกับผู้บริหารอย่างไร?", a: "Mission Control ให้ตัวเลขจริง + พยากรณ์ + เตือน เพื่อให้ตัดสินใจได้ภายใน 15 นาทีต่อวัน" },
    { q: "ข้อมูลปลอดภัยหรือไม่?", a: "มี RBAC/บันทึกกิจกรรม/การอนุมัติ (แผนทีม), การเข้ารหัส และควบคุมการแชร์รายงาน" },
    { q: "ยกเลิกเมื่อไรก็ได้ไหม?", a: "ได้ ไม่มีสัญญาผูกมัด ยกเลิกได้จากหน้าเรียกเก็บเงิน" },
    { q: "ต่างจาก ERP/OKR/Asana อย่างไร?", a: "Bizzyztem คือ ระบบปฏิบัติการรายวันของ CEO — เน้นภาพรวม/ตัดสินใจไว/รายงานพร้อมยื่น ไม่ใช่เครื่องมือจัดคิวงานรายวัน" },
    { q: "ย้ายออก/ดาวน์โหลดข้อมูลได้ไหม?", a: "ได้ ดาวน์โหลด/Export ได้ตลอดเวลา (PDF/DOCX/XLSX/CSV)" },
  ];
  return (
    <section className="py-14 md:py-20">
      <Container>
        <SectionHeader title="คำถามที่พบบ่อย" />
        <div className="mt-6 grid gap-3">
          {qa.map((item, i) => (
            <QA key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-14">
      <Container>
        <div className="rounded-2xl bg-gradient-to-br from-blue-800 to-blue-700 p-6 md:p-10 text-white shadow-sm">
          <h3 className="text-2xl md:3xl font-semibold">เห็นภาพรวมตอนนี้เลย — เริ่มทดลอง 30 วันฟรี</h3>
          <p className="mt-2 text-blue-100">ปลดล็อกภาพรวมทั้งบริษัท + รายงานสถานะธุรกิจวันนี้ เริ่มจาก Core ฟรี และเลือกซื้อโมดูลเมื่อพร้อม</p>
          <div className="mt-6">
            <ButtonLink href="#signup" variant="secondary" className="px-4 py-2">เริ่มทดลอง 30 วันฟรี</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10 border-t bg-white">
      <Container className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-2 text-slate-600">
          <Sparkles className="h-4 w-4 text-blue-700" />
          <span>Bizzyztem © {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#terms" className="hover:text-slate-700">ข้อกำหนด</a>
          <a href="#privacy" className="hover:text-slate-700">นโยบายความเป็นส่วนตัว</a>
          <a href="#security" className="hover:text-slate-700">ความปลอดภัย</a>
          <a href="#contact" className="hover:text-slate-700">ติดต่อเรา</a>
        </div>
      </Container>
    </footer>
  );
}
