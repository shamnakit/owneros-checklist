// pages/index.tsx (FIXED FULL)
import Head from "next/head";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, BarChart3, CheckCircle2, PlayCircle, ShieldCheck, Users2, X } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const sampleData = [
  { cat: "Strategy", value: 68 },
  { cat: "Org", value: 66 },
  { cat: "SOP", value: 56 },
  { cat: "HR", value: 72 },
  { cat: "Finance", value: 71 },
  { cat: "Sales", value: 45 },
];

const Progress = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm text-slate-700">
      <span>{label}</span>
      <span className="font-medium">{value}%</span>
    </div>
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${value}%` }} aria-label={`${label} ${value}%`} />
    </div>
  </div>
);

export default function LandingIndexPage() {
  const title = "Bizsystem – SME Health Check ฟรี | รู้สุขภาพองค์กรใน 7 นาที";
  const description =
    "เช็กความพร้อมของธุรกิจใน 6 หมวดสำคัญ พร้อมคะแนนทันที เปรียบเทียบกับ SME ไทย และคำแนะนำแบบ Actionable";
  const og = {
    url: "https://yourdomain.com/", // TODO: ใส่โดเมนจริง
    image: "/og/landing-sme-health-check.png", // TODO: ใส่รูปจริง
  };

  const [interestOpen, setInterestOpen] = useState(false);
  const [initialPlan, setInitialPlan] = useState<"Pro" | "Premium">("Pro");

  const openInterest = (plan: "Pro" | "Premium") => {
    setInitialPlan(plan);
    setInterestOpen(true);
  };

  const handleCta = (where: string) => {
    if (typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.capture("CTA Clicked", { where, page: "landing" });
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={og.url} />
        <meta property="og:image" content={og.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={og.image} />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
        {/* Topbar */}
        <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-blue-600 shadow-sm" />
              <span className="text-lg font-semibold tracking-tight">Bizsystem</span>
              <span className="ml-3 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">SME Health Check</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
              <a href="#benefits" className="hover:text-slate-900">ประโยชน์</a>
              <a href="#demo" className="hover:text-slate-900">ตัวอย่าง</a>
              <a href="#testimonials" className="hover:text-slate-900">ลูกค้า</a>
              <a href="#pricing" className="hover:text-slate-900">ราคา</a>
              <a href="#faq" className="hover:text-slate-900">คำถาม</a>
            </nav>
            <a href="/login" onClick={() => handleCta("header")} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700">
              เริ่มทำแบบทดสอบฟรี <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-indigo-100 blur-3xl" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
                รู้สุขภาพองค์กรคุณใน <span className="text-blue-600">7 นาที</span> – ฟรี!
              </h1>
              <p className="text-lg text-slate-700">
                เช็กความพร้อมของธุรกิจใน 6 หมวดสำคัญ (Strategy, Org, SOP, HR, Finance, Sales)
                พร้อมคะแนนทันที เทียบกับ SME ไทย และคำแนะนำถัดไปแบบ Actionable
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="/login" onClick={() => handleCta("hero-primary")} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-white text-base font-medium shadow-sm hover:bg-blue-700">
                  เริ่มทำแบบทดสอบฟรี <ArrowRight className="h-5 w-5" />
                </a>
                <a href="#demo" onClick={() => handleCta("hero-secondary")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3 text-slate-800 hover:bg-slate-50">
                  ดูตัวอย่างผลลัพธ์ <PlayCircle className="h-5 w-5" />
                </a>
              </div>
              <div className="flex items-center gap-4 pt-2 text-sm text-slate-600">
                <div className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600"/>ฟรี 100% ไม่ต้องใช้บัตรเครดิต</div>
                <div className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-blue-600"/>ภาษาไทย ใช้ง่ายสำหรับ CEO</div>
              </div>
            </motion.div>

            {/* Preview Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Owner Readiness Dashboard</h3>
                  <p className="text-sm text-slate-600">ตัวอย่างผลลัพธ์หลังเช็กสุขภาพองค์กร</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">ตัวอย่าง</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={sampleData} outerRadius={90}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="cat" tick={{ fill: "#334155", fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <Radar name="คะแนน" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.35} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {sampleData.map((d) => (
                    <Progress key={d.cat} label={d.cat} value={d.value} />
                  ))}
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-600">ระดับภาพรวม</div>
                    <div className="mt-1 text-lg font-semibold">Developing</div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                      <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: "68%" }} />
                    </div>
                    <div className="mt-1 text-xs text-slate-600">คะแนนรวม 68% • เป้าหมายถัดไป: 75%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-6">
              <BenefitCard icon={<CheckCircle2 className="h-6 w-6" />} title="คะแนนสุขภาพองค์กร 650 คะแนน" desc="เห็นจุดแข็ง–จุดอ่อนชัดเจน พร้อมคะแนนต่อหมวด" />
              <BenefitCard icon={<BarChart3 className="h-6 w-6" />} title="รายงาน Readiness & Gap" desc="คำแนะนำถัดไปแบบ Actionable ใช้คุยกับบอร์ด/ธนาคาร" />
              <BenefitCard icon={<Users2 className="h-6 w-6" />} title="Benchmark กับ SME ไทย" desc="เปรียบเทียบระดับความพร้อมกับธุรกิจประเภทใกล้เคียง" />
              <BenefitCard icon={<BadgeCheck className="h-6 w-6" />} title="ฟรี 100%" desc="เริ่มใช้ได้ทันที ไม่ต้องใส่บัตรเครดิต" />
            </div>
          </div>
        </section>

        {/* Demo */}
        <section id="demo" className="py-12 lg:py-16 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold">หน้าตาเป็นอย่างไร?</h2>
                <p className="text-slate-600">ตัวอย่าง Dashboard ที่ได้หลังทำแบบทดสอบ</p>
              </div>
              <a href="/login" onClick={() => handleCta("demo-cta")} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700">
                เริ่มทำแบบทดสอบฟรี <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={sampleData} outerRadius={110}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="cat" tick={{ fill: "#334155", fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <Radar name="คะแนน" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.35} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-4">
                  {sampleData.map((d) => (
                    <Progress key={d.cat} label={d.cat} value={d.value} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8">เสียงจากผู้ใช้งาน</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <TestimonialCard quote="ทำให้เห็นภาพรวมองค์กรในเวลาไม่กี่นาที จัดลำดับสิ่งที่ต้องทำได้ทันที" author="คุณกิตติ – เจ้าของโรงงานอาหาร" />
              <TestimonialCard quote="รายงาน Export เอาไปคุยกับบอร์ดได้เลย ประหยัดเวลาเตรียมเอกสารมาก" author="คุณนภ – ผู้บริหารซอฟต์แวร์เฮาส์" />
              <TestimonialCard quote="คะแนน + คำแนะนำช่วยให้ทีมโฟกัสที่ gap สำคัญ ส่งผลต่อยอดขายจริง" author="คุณพร – ผู้จัดการฝ่ายขาย" />
            </div>
          </div>
        </section>

        {/* Pricing Teaser (Interest Capture) */}
        <section id="pricing" className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-8">เริ่มฟรี – สนใจแพ็กเกจขั้นสูง? ฝากคอนแทคไว้</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <PricingTeaser tier="Free" desc="ทำแบบทดสอบ + Dashboard พื้นฐาน" button="เริ่มใช้ฟรี" onClick={() => (window.location.href = "/login")} highlight={false} />
              <PricingTeaser tier="Pro" desc="Export Binder / Evidence / Suggestion" button="สนใจ Pro (ฝากคอนแทค)" onClick={() => openInterest("Pro")} highlight={true} />
              <PricingTeaser tier="Premium" desc="Multi-user / Advanced Insights / Priority Support" button="สนใจ Premium (ฝากคอนแทค)" onClick={() => openInterest("Premium")} highlight={false} />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-12 lg:py-16 bg-slate-50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">คำถามที่พบบ่อย</h2>
            <FAQItem q="ฟรีจริงไหม ต้องใส่บัตรเครดิตหรือไม่?" a="ฟรี 100% สำหรับการทำแบบทดสอบและดู Dashboard พื้นฐาน ไม่ต้องใส่บัตรเครดิต" />
            <FAQItem q="คะแนน 650 คำนวณอย่างไร" a="อิง 6 หมวดหลักของการบริหารองค์กร โดยแปลงเป็นคะแนนถ่วงน้ำหนักและเทียบกับฐานข้อมูล SME ไทย" />
            <FAQItem q="Export Binder คืออะไร" a="รายงานสรุปพร้อมแนบหลักฐานสำหรับคุยกับบอร์ด/ธนาคาร/นักลงทุน (จะเปิดขายในแพ็กเกจ Pro)" />
            <FAQItem q="ข้อมูลปลอดภัยหรือไม่" a="เราเก็บเฉพาะเมทาดาต้าที่จำเป็น พร้อมมาตรการเข้ารหัสและสิทธิ์การเข้าถึงตามมาตรฐานองค์กร" />
          </div>
        </section>

        {/* CTA Repeat */}
        <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50 border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-2xl font-bold mb-2">เริ่มต้นฟรีวันนี้ – รู้จุดแข็งจุดอ่อนองค์กรคุณใน 7 นาที</h3>
            <p className="text-slate-600 mb-6">ไม่มีค่าใช้จ่าย • ไม่ต้องใส่บัตรเครดิต • ยกเลิกได้ตลอดเวลา</p>
            <a href="/login" onClick={() => handleCta("footer")} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-white text-base font-medium shadow-sm hover:bg-blue-700">
              ทำแบบทดสอบเลย <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-sm text-slate-600 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>© {new Date().getFullYear()} Bizsystem • Evidence‑First Execution OS</div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-slate-900">Privacy</a>
              <a href="#" className="hover:text-slate-900">Terms</a>
              <a href="#" className="hover:text-slate-900">Contact</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Interest Modal */}
      <InterestModal open={interestOpen} onClose={() => setInterestOpen(false)} initialPlan={initialPlan} />
    </>
  );
}

// ==== Components ====
function BenefitCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function StepCard({ no, title, desc }: { no: number; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold">{no}</div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function TestimonialCard({ quote, author }: { quote: string; author: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-slate-800">“{quote}”</p>
      <div className="mt-3 text-sm text-slate-600">— {author}</div>
    </div>
  );
}

function PricingTeaser({ tier, desc, button, onClick, highlight }: { tier: string; desc: string; button: string; onClick: () => void; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border ${highlight ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"} bg-white p-6 shadow-sm flex flex-col`}>
      <div className="text-sm font-medium text-slate-600">{tier}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
      <button onClick={onClick} className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl ${highlight ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"} px-4 py-2`}>
        {button} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-slate-200 py-4">
      <summary className="cursor-pointer list-none flex items-center justify-between text-slate-900 font-medium">
        {q}
        <span className="transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <p className="mt-2 text-slate-600 text-sm">{a}</p>
    </details>
  );
}

// Modal to collect interest contacts
function InterestModal({ open, onClose, initialPlan }: { open: boolean; onClose: () => void; initialPlan: "Pro" | "Premium" }) {
  const [plan, setPlan] = useState<"Pro" | "Premium" | "Free">(initialPlan);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    setPlan(initialPlan);
  }, [initialPlan]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (typeof window !== "undefined" && (window as any).posthog) {
        (window as any).posthog.capture("pricing_interest", { plan, name, email, phone, company });
      }
      const list = JSON.parse(localStorage.getItem("pricing_interest") || "[]");
      list.push({ ts: Date.now(), plan, name, email, phone, company });
      localStorage.setItem("pricing_interest", JSON.stringify(list));
      try {
        await fetch("/api/interest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, name, email, phone, company }) });
      } catch {}
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">ลงทะเบียนความสนใจแพ็กเกจ {plan}</h3>
          <button className="rounded-full p-1 hover:bg-slate-100" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {submitted ? (
          <div className="mt-4">
            <p className="text-slate-700">รับเรื่องเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด ขอบคุณครับ 🙏</p>
            <div className="mt-6 text-right">
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={onClose}>ปิดหน้าต่าง</button>
            </div>
          </div>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <div>
              <label className="text-sm text-slate-700">แพ็กเกจที่สนใจ</label>
              <select className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={plan} onChange={(e) => setPlan(e.target.value as any)}>
                <option value="Pro">Pro</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-700">ชื่อ-นามสกุล</label>
                <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm text-slate-700">เบอร์โทร</label>
                <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-700">อีเมล</label>
              <input type="email" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm text-slate-700">บริษัท</label>
              <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>

            {/* honeypot */}
            <input type="text" className="hidden" autoComplete="off" tabIndex={-1} aria-hidden />

            <div className="pt-2 text-right">
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                ส่งข้อมูลความสนใจ
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
