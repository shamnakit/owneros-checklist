// pages/index.tsx
import Head from "next/head";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FolderClosed,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Stars,
  X,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

// ====== Sample data (roles on the ship) ======
const sampleData = [
  { cat: "Captain (Strategy)", value: 72 },
  { cat: "Navigation (Org)", value: 66 },
  { cat: "Propulsion (SOP)", value: 58 },
  { cat: "Crew Care (HR)", value: 74 },
  { cat: "Fuel (Finance)", value: 69 },
  { cat: "Comms (Sales)", value: 52 },
];

// ====== Helpers ======
const formatNumber = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

const getScoreBand = (score: number) => {
  if (score >= 100) return { label: "Touchdown", color: "bg-emerald-600" };
  if (score >= 95) return { label: "Lunar Orbit", color: "bg-emerald-500" };
  if (score >= 75) return { label: "Lunar Approach", color: "bg-blue-600" };
  if (score >= 50) return { label: "Trans-Lunar", color: "bg-indigo-600" };
  if (score >= 25) return { label: "Earth Orbit", color: "bg-slate-600" };
  return { label: "Grounded", color: "bg-slate-400" };
};

const Progress = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm text-slate-700">
      <span>{label}</span>
      <span className="font-medium">{value}%</span>
    </div>
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-blue-600"
        style={{ width: `${value}%` }}
        aria-label={`${label} ${value}%`}
      />
    </div>
  </div>
);

// ====== Page ======
export default function LandingIndexPage() {
  const title =
    "Bizzyztem — Mission to the Moon | System Doc Hub & Mission Control for SMEs";
  const description =
    "ภารกิจสร้างระบบธุรกิจให้ถึงเป้าหมาย • รวมเอกสารระบบไว้ศูนย์กลางเดียว แล้วพาธุรกิจเดินทางได้ต่อเนื่อง • Distance to Moon dashboard พร้อมใช้งาน";
  const og = {
    url: "https://yourdomain.com/", // TODO: ใส่โดเมนจริง
    image: "/og/landing-mission-to-the-moon.png", // TODO: ใส่รูปจริง
  };

  // --- Mock mission stats ---
  const totalScore = 68; // 0–100 รวมทุกหมวด
  const distanceKm = useMemo(
    () => Math.round(384_400 * (totalScore / 100)),
    [totalScore]
  );
  const band = getScoreBand(totalScore);
  const greenlightPct = 82; // Mock: ดัชนีความพร้อมรวม

  // --- UI State ---
  const [interestOpen, setInterestOpen] = useState(false);
  const [initialPlan, setInitialPlan] = useState<"Pro" | "Premium">("Pro");

  const openInterest = (plan: "Pro" | "Premium") => {
    setInitialPlan(plan);
    setInterestOpen(true);
  };

  const handleCta = (where: string) => {
    if (typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.capture("cta_clicked", { where, page: "landing" });
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* OpenGraph / Twitter */}
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
              <div className="h-9 w-9 rounded-2xl bg-blue-600 shadow-sm grid place-items-center">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Bizzyztem
              </span>
              <span className="ml-3 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                System Doc Hub
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
              <a href="#value" className="hover:text-slate-900">
                คุณค่า
              </a>
              <a href="#product" className="hover:text-slate-900">
                ตัวอย่าง
              </a>
              <a href="#pricing" className="hover:text-slate-900">
                ราคา
              </a>
              <a href="#faq" className="hover:text-slate-900">
                คำถาม
              </a>
            </nav>
            <a
              href="/login"
              onClick={() => handleCta("header")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
            >
              เริ่มภารกิจ <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-indigo-100 blur-3xl" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
                ภารกิจสร้างระบบธุรกิจให้ถึงเป้าหมาย
              </h1>
              <p className="text-lg text-slate-700">
                รวมเอกสารระบบไว้ศูนย์กลางเดียว แล้วพาธุรกิจเดินทางได้ต่อเนื่อง —
                ตั้งภารกิจ แบ่งเฟส สะสมความก้าวหน้า และ{" "}
                <span className="font-semibold">ดูระยะ Distance to Moon</span>{" "}
                แบบเรียลไทม์
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/login"
                  onClick={() => handleCta("hero-primary")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-white text-base font-medium shadow-sm hover:bg-blue-700"
                >
                  เริ่มภารกิจ <ArrowRight className="h-5 w-5" />
                </a>
                <a
                  href="#product"
                  onClick={() => handleCta("hero-secondary")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3 text-slate-800 hover:bg-slate-50"
                >
                  ดูตัวอย่าง <PlayCircle className="h-5 w-5" />
                </a>
              </div>

              {/* Trust pills */}
              <div className="flex items-center gap-4 pt-2 text-sm text-slate-600">
                <div className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  ปลอดภัย สิทธิ์เป็นรายบทบาท
                </div>
                <div className="inline-flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-blue-600" />
                  ไทยล้วน ใช้ง่ายสำหรับผู้บริหาร
                </div>
              </div>

              {/* Hero Stat Band */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div>
                    <div className="text-sm text-slate-600">
                      ระยะทางถึงดวงจันทร์
                    </div>
                    <div className="text-2xl font-semibold">
                      {formatNumber(distanceKm)} กม.
                    </div>
                    <div className="text-xs text-slate-500">
                      คำนวณจากคะแนนรวม {totalScore}% (สูตร 384,400 × score/100)
                    </div>
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>0</span>
                      <span>384,400 กม.</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${totalScore}%` }}
                        aria-label={`Distance progress ${totalScore}%`}
                      />
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white ${band.color}`}
                  >
                    <Stars className="h-3.5 w-3.5" />
                    {band.label}
                  </span>
                  <div className="text-sm text-slate-700">
                    Greenlight Readiness{" "}
                    <span className="font-semibold">{greenlightPct}%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Preview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Mission Control Dashboard
                  </h3>
                  <p className="text-sm text-slate-600">
                    ตัวอย่างภาพรวม “ระบบธุรกิจ” บนหน้าเดียว
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  ตัวอย่าง
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={sampleData} outerRadius={90}>
                      <PolarGrid />
                      <PolarAngleAxis
                        dataKey="cat"
                        tick={{ fill: "#334155", fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                      />
                      <Radar
                        name="คะแนน"
                        dataKey="value"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.35}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {sampleData.map((d) => (
                    <Progress key={d.cat} label={d.cat} value={d.value} />
                  ))}
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-600">ระดับภาพรวม</div>
                    <div className="mt-1 text-lg font-semibold">
                      {band.label}
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                      <div
                        className="h-1.5 rounded-full bg-indigo-600"
                        style={{ width: `${totalScore}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      คะแนนรวม {totalScore}% • ระยะทาง{" "}
                      {formatNumber(distanceKm)} กม.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Value */}
        <section id="value" className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6">
              <BenefitCard
                icon={<FolderClosed className="h-6 w-6" />}
                title="System Doc Hub (ศูนย์รวมเอกสารระบบ)"
                desc="รวมแผน, SOP/WI, แบบฟอร์ม, นโยบาย, สัญญา, ใบอนุญาต—อยู่ศูนย์กลางเดียว ค้นง่าย แชร์ง่าย"
              />
              <BenefitCard
                icon={<CheckCircle2 className="h-6 w-6" />}
                title="Greenlight Readiness"
                desc="ตัวชี้วัดความพร้อมของทั้งองค์กร—เอกสารครบ เจ้าภาพครบ ความเสี่ยงอยู่ในเกณฑ์"
              />
              <BenefitCard
                icon={<BadgeCheck className="h-6 w-6" />}
                title="Export-Ready Mission Report"
                desc="สรุปสถานะภารกิจ + สารบัญเอกสารระบบในคลิกเดียว ใช้คุยกับบอร์ด/ธนาคาร/คู่ค้าได้ทันที"
              />
            </div>
          </div>
        </section>

        {/* Product Showcase */}
        <section id="product" className="py-12 lg:py-16 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold">หน้าตาเป็นอย่างไร?</h2>
                <p className="text-slate-600">
                  ตัวอย่าง Mission Control และเอกสารระบบที่ถูกรวมไว้ศูนย์กลางเดียว
                </p>
              </div>
              <a
                href="/login"
                onClick={() => handleCta("product-cta")}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
              >
                เริ่มภารกิจ <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={sampleData} outerRadius={110}>
                        <PolarGrid />
                        <PolarAngleAxis
                          dataKey="cat"
                          tick={{ fill: "#334155", fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={{ fill: "#94a3b8", fontSize: 10 }}
                        />
                        <Radar
                          name="คะแนน"
                          dataKey="value"
                          stroke="#2563eb"
                          fill="#2563eb"
                          fillOpacity={0.35}
                        />
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

        {/* How it works */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">ทำอย่างไร</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <StepCard
                no={1}
                title="ตั้งภารกิจ"
                desc="กำหนดเป้าหมาย/เจ้าภาพ/ETA และแบ่งเฟสบิน"
              />
              <StepCard
                no={2}
                title="อัปโหลด Mission Docs"
                desc="รวบเอกสารระบบทั้งหมดไว้ศูนย์กลางเดียว"
              />
              <StepCard
                no={3}
                title="ดาวน์โหลด Mission Report"
                desc="สรุปสถานะ + สารบัญเอกสารระบบในคลิกเดียว"
              />
            </div>
            <div className="mt-8">
              <a
                href="/login"
                onClick={() => handleCta("howto-cta")}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-white text-base font-medium shadow-sm hover:bg-blue-700"
              >
                เริ่มภารกิจ <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-8">
              เริ่มฟรี – สนใจแพ็กเกจขั้นสูง? ฝากคอนแทคไว้
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <PricingTeaser
                tier="Crew (Free)"
                desc="ตั้งภารกิจ 3 รายการ • อัปโหลด Mission Docs • ดูสรุป"
                button="เริ่มใช้ฟรี"
                onClick={() => (window.location.href = "/login")}
                highlight={false}
              />
              <PricingTeaser
                tier="Pilot (Pro)"
                desc="Approver/Reviewer • Alerts • ดาวน์โหลด Mission Report ไม่จำกัด • ทีม 5 ที่นั่ง"
                button="สนใจ Pro (ฝากคอนแทค)"
                onClick={() => openInterest("Pro")}
                highlight={true}
              />
              <PricingTeaser
                tier="Commander (Add-on)"
                desc="Filing/IPO Pack • Data Room (Lite) • สิทธิ์ขั้นสูง • ทีม 15 ที่นั่ง"
                button="สนใจ Add-on (ฝากคอนแทค)"
                onClick={() => openInterest("Premium")}
                highlight={false}
              />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-12 lg:py-16 bg-slate-50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">คำถามที่พบบ่อย</h2>
            <FAQItem
              q="เริ่มยากไหม?"
              a="ตั้ง 3 ภารกิจ + อัปโหลดเอกสารระบบ 1 ชุด ก็เห็นสรุปได้ภายใน 10 นาที"
            />
            <FAQItem
              q="ข้อมูลปลอดภัยหรือไม่?"
              a="จัดเก็บเข้ารหัสและใช้สิทธิ์การเข้าถึงแบบรายบทบาท (Role-based)"
            />
            <FAQItem
              q="ใครเห็นอะไรได้บ้าง?"
              a="Owner/Manager/Reviewer/Approver ตั้งสิทธิ์เข้าถึงได้ตามบทบาท"
            />
            <FAQItem
              q="รายงานส่งให้ใครบ้างได้?"
              a="บอร์ด/ธนาคาร/คู่ค้า ผ่านลิงก์หรือไฟล์ PDF (Mission Report)"
            />
          </div>
        </section>

        {/* CTA Repeat */}
        <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50 border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-2xl font-bold mb-2">
              เริ่มภารกิจของธุรกิจคุณวันนี้
            </h3>
            <p className="text-slate-600 mb-6">
              รวมเอกสารระบบไว้ศูนย์กลางเดียว • Distance to Moon • พร้อมรายงาน
            </p>
            <a
              href="/login"
              onClick={() => handleCta("footer")}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-white text-base font-medium shadow-sm hover:bg-blue-700"
            >
              เริ่มภารกิจ <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-sm text-slate-600 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>© {new Date().getFullYear()} Bizzyztem • Mission to the Moon</div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-slate-900">
                Privacy
              </a>
              <a href="#" className="hover:text-slate-900">
                Terms
              </a>
              <a href="#" className="hover:text-slate-900">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Interest Modal */}
      <InterestModal
        open={interestOpen}
        onClose={() => setInterestOpen(false)}
        initialPlan={initialPlan}
      />
    </>
  );
}

// ==== Components ====
function BenefitCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function StepCard({
  no,
  title,
  desc,
}: {
  no: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold">
        {no}
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{desc}</p>
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

function PricingTeaser({
  tier,
  desc,
  button,
  onClick,
  highlight,
}: {
  tier: string;
  desc: string;
  button: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border ${
        highlight ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"
      } bg-white p-6 shadow-sm flex flex-col`}
    >
      <div className="text-sm font-medium text-slate-600">{tier}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
      <button
        onClick={onClick}
        className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl ${
          highlight
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
        } px-4 py-2`}
      >
        {button} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// Modal to collect interest contacts
function InterestModal({
  open,
  onClose,
  initialPlan,
}: {
  open: boolean;
  onClose: () => void;
  initialPlan: "Pro" | "Premium";
}) {
  const [plan, setPlan] = useState<"Pro" | "Premium">(initialPlan);
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
        (window as any).posthog.capture("pricing_interest", {
          plan,
          name,
          email,
          phone,
          company,
        });
      }
      const list = JSON.parse(localStorage.getItem("pricing_interest") || "[]");
      list.push({ ts: Date.now(), plan, name, email, phone, company });
      localStorage.setItem("pricing_interest", JSON.stringify(list));
      try {
        await fetch("/api/interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, name, email, phone, company }),
        });
      } catch {}
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            ลงทะเบียนความสนใจแพ็กเกจ {plan}
          </h3>
          <button
            className="rounded-full p-1 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {submitted ? (
          <div className="mt-4">
            <p className="text-slate-700">
              รับเรื่องเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด ขอบคุณครับ 🙏
            </p>
            <div className="mt-6 text-right">
              <button
                className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={onClose}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <div>
              <label className="text-sm text-slate-700">แพ็กเกจที่สนใจ</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                value={plan}
                onChange={(e) => setPlan(e.target.value as any)}
              >
                <option value="Pro">Pro</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-700">ชื่อ-นามสกุล</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">เบอร์โทร</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-700">อีเมล</label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-700">บริษัท</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            {/* honeypot */}
            <input type="text" className="hidden" autoComplete="off" tabIndex={-1} aria-hidden />

            <div className="pt-2 text-right">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                ส่งข้อมูลความสนใจ
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
