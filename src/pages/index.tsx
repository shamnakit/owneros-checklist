import React from "react";
import { Activity, BarChart3, BellRing, CheckCircle2, FileText, Gauge, Goal, LineChart, Lock, Mail, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";

/**
 * Bizzyztem — Landing Page (TH) • Tailwind‑only
 * ไม่พึ่ง shadcn/ui • ไม่มี asChild/variant/size ของ lib อื่น
 * ใช้ได้กับ Next.js (App Router หรือ Pages) หรือ React เดี่ยว ๆ
 * หากยังไม่มีไอคอน: `npm i lucide-react`
 */

export default function LandingPageTH_TailwindOnly() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-slate-50 text-slate-900">
      <NavBar />
      <Hero />
      <ValueCards />
      <HowItWorks />
      <ScreenshotBlock />
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
          <p className="mt-4 text-slate-600 text-lg">แผงควบคุมสำหรับผู้บริหาร: การ์ด 6 KPI + พยากรณ์ถึงเส้นตาย + สรุปทุกเช้า (Morning Brief)</p>
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
    { title: "สรุปตอนเช้า", desc: "ดูตัวเลขสำคัญ + แจ้งเตือนสิ่งผิดปกติจาก Morning Brief", icon: Mail },
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

function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-white">
      <Container>
        <SectionHeader title="ราคา (เรียบ เข้าใจง่าย)" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <PriceCard title="Free" price="฿0" audience="เริ่มต้น/ทดสอบ" features={["การ์ด KPI 2 ใบ", "การเตือนพื้นฐาน", "Check‑in 2 ครั้ง/เดือน", "Export ฉบับย่อ 1 ครั้ง/เดือน"]} cta={{ href: "#signup", label: "เริ่มฟรี" }} />
          <PriceCard title="Pro (Solo)" price="฿199" audience="เจ้าของ/CEO คนเดียว" highlight features={["การ์ด 6 KPI", "Morning Brief", "Drilldown/กราฟ", "Reforecast/What‑if", "Scenario/Decision/Board Pack (ฉบับย่อ)"]} cta={{ href: "#upgrade", label: "อัปเกรดเป็น Pro" }} />
          <PriceCard title="Team/Premium" price="฿1,490 / ฿2,990 / ฿4,900" audience="ทีมระดับกลาง (M) — 5/10/20 ที่นั่ง" features={["ทุกอย่างใน Pro", "Dept roll‑ups เต็ม", "Scenario/Decision Inbox เต็ม", "Export เต็ม", "RBAC/Approvals/Masking"]} cta={{ href: "#contact", label: "พูดคุยทีมขาย" }} />
        </div>
        <p className="text-center text-sm text-slate-500 mt-4">ทดลองใช้ครบทุกฟีเจอร์ 30 วัน — ครบกำหนดจะลดเป็นแผนฟรี และเสนออัปเกรด</p>
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
        <div className="mt-2 text-3xl font-semibold">{price}<span className="text-base font-normal text-slate-500">/เดือน</span></div>
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
        <div className="rounded-2xl bg-gradient-to-br from-blue-800 to-blue-700 p-6 md:p-10 text-white shadow-md">
          <h3 className="text-2xl md:text-3xl font-semibold">เห็นภาพรวมตอนนี้เลย — เริ่มทดลอง 30 วันฟรี</h3>
          <p className="mt-2 text-blue-100">ปลดล็อกภาพรวมทั้งบริษัท + Morning Brief ทุกเช้า เริ่มที่ <span className="font-semibold">฿199/เดือน</span></p>
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
