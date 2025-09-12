// pages/index.tsx
import Head from "next/head";
import React, { useEffect, useMemo, useState } from "react";
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
  Crown,
  Compass,
  Cog,
  Users2,
  Wallet,
  Megaphone,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { track } from "@/lib/analytics/posthog.client";
import NextImage from "next/image";

/* ====== Sample data (roles on the ship) ====== */
const sampleData = [
  { cat: "Captain (Strategy)", value: 72 },
  { cat: "Navigation (Org)", value: 66 },
  { cat: "Propulsion (SOP)", value: 58 },
  { cat: "Crew Care (HR)", value: 74 },
  { cat: "Fuel (Finance)", value: 69 },
  { cat: "Comms (Sales)", value: 52 },
];

/* ====== Helpers ====== */
const formatNumber = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

const getScoreBand = (score: number) => {
  if (score >= 100) return { label: "Touchdown", color: "bg-emerald-600" };
  if (score >= 95) return { label: "Lunar Orbit", color: "bg-emerald-500" };
  if (score >= 75) return { label: "Lunar Approach", color: "bg-brand-600" };
  if (score >= 50) return { label: "Trans-Lunar", color: "bg-indigo-600" };
  if (score >= 25) return { label: "Earth Orbit", color: "bg-slate-600" };
  return { label: "Grounded", color: "bg-slate-400" };
};

const Progress = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm text-white/80">
      <span>{label}</span>
      <span className="font-medium">{value}%</span>
    </div>
    <div className="h-2 w-full rounded-full bg-white/15">
      <div
        className="h-2 rounded-full bg-brand-600"
        style={{ width: `${value}%` }}
        aria-label={`${label} ${value}%`}
      />
    </div>
  </div>
);

export default function LandingIndexPage() {
  const title =
    "Bizzyztem — Mission to the Moon | System Doc Hub & Mission Control for SMEs";
  const description =
    "ภารกิจสร้างระบบธุรกิจให้ถึงเป้าหมาย • รวมเอกสารระบบไว้ศูนย์กลางเดียว แล้วพาธุรกิจเดินทางได้ต่อเนื่อง • Distance to Moon dashboard พร้อมใช้งาน";
  const og = { url: "https://yourdomain.com/", image: "/og/landing-mission-to-the-moon.png" };

  // --- Mock mission stats ---
  const totalScore = 68; // 0–100 รวมทุกหมวด
  const distanceKm = useMemo(() => Math.round(384_400 * (totalScore / 100)), [totalScore]);
  const band = getScoreBand(totalScore);
  const greenlightPct = 82;

  // --- UI State ---
  const [interestOpen, setInterestOpen] = useState(false);
  const [initialPlan, setInitialPlan] = useState<"Pro" | "Premium">("Pro");

  // Header scroll (โปร่ง → ขาวเมื่อเลื่อน)
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { track("visit_landing", { page: "landing" }); }, []);

  const openInterest = (plan: "Pro" | "Premium") => { setInitialPlan(plan); setInterestOpen(true); };
  const handleCta = (where: string) => { track("cta_start_click", { where, page: "landing" }); };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* OG/Twitter */}
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

      <div className="min-h-screen bg-[#0B1220] text-white">
        {/* Header */}
        <header className={`fixed top-0 w-full z-40 transition-colors ${scrolled ? "bg-white/80 backdrop-blur border-b border-slate-200 text-slate-900" : "bg-transparent text-white"}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-brand-600 shadow-sm grid place-items-center">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Bizzyztem</span>
              <span className={`ml-3 rounded-full px-2.5 py-1 text-xs font-medium ${scrolled ? "bg-slate-100 text-slate-700" : "bg-white/10"}`}>System Doc Hub</span>
            </div>
            <nav className={`hidden md:flex items-center gap-8 text-sm ${scrolled ? "text-slate-600" : "text-white/80"}`}>
              <a href="#value" className={`${scrolled ? "hover:text-slate-900" : "hover:text-white"}`}>คุณค่า</a>
              <a href="#product" className={`${scrolled ? "hover:text-slate-900" : "hover:text-white"}`}>ตัวอย่าง</a>
              <a href="#roles" className={`${scrolled ? "hover:text-slate-900" : "hover:text-white"}`}>บทบาท</a>
              <a href="#pricing" className={`${scrolled ? "hover:text-slate-900" : "hover:text-white"}`}>ราคา</a>
              <a href="#faq" className={`${scrolled ? "hover:text-slate-900" : "hover:text-white"}`}>คำถาม</a>
            </nav>
            <a href="/login" onClick={() => handleCta("header")} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-white shadow-sm hover:bg-brand-700">
              เริ่มภารกิจ <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </header>

        {/* === FULL-BLEED HERO === */}
        <section className="relative isolate min-h-[88vh]">
          <div className="absolute inset-0 bg-[#0B1220]" />
          <NextImage
            src="/illustrations/hero-rocket-moon.png"  // ← คุณเขียนทับไฟล์เดิมไว้แล้ว
            alt="Mission to the Moon"
            fill
            priority
            className="absolute inset-0 object-cover object-right md:object-[75%] opacity-95"
          />
          <div className="hero-starfield" />
          <div className="hero-vignette" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220] via-[#0B1220]/60 to-transparent" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pb-24 grid lg:grid-cols-2 items-center">
            <div className="space-y-6 max-w-xl lg:max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                ภารกิจสร้างระบบธุรกิจให้ถึงเป้าหมาย
              </h1>
              <p className="text-lg text-white/80">
                รวมเอกสารระบบไว้ศูนย์กลางเดียว แล้วพาธุรกิจเดินทางได้ต่อเนื่อง — ตั้งภารกิจ แบ่งเฟส สะสมความก้าวหน้า และ{" "}
                <span className="font-semibold">ดูระยะ Distance to Moon</span> แบบเรียลไทม์
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <a href="/login" onClick={() => handleCta("hero-primary")} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-white text-base font-medium shadow-sm hover:bg-brand-700">
                  เริ่มภารกิจ <ArrowRight className="h-5 w-5" />
                </a>
                <a href="#product" onClick={() => handleCta("hero-secondary")} className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/0 px-6 py-3 hover:bg-white/10">
                  ดูตัวอย่าง <PlayCircle className="h-5 w-5" />
                </a>
              </div>

              <div className="mt-4 rounded-2xl border border-white/15 bg-white/[0.06] p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div>
                    <div className="text-sm text-white/70">ระยะทางถึงดวงจันทร์</div>
                    <div className="text-2xl font-semibold">{formatNumber(distanceKm)} กม.</div>
                    <div className="text-xs text-white/60">คำนวณจากคะแนนรวม {totalScore}% (สูตร 384,400 × score/100)</div>
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <div className="flex items-center justify-between text-xs text-white/70"><span>0</span><span>384,400 กม.</span></div>
                    <div className="mt-1 h-2 w-full rounded-full bg-white/20">
                      <div className="h-2 rounded-full bg-brand-600" style={{ width: `${totalScore}%` }} />
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white ${band.color}`}>
                    <Stars className="h-3.5 w-3.5" /> {band.label}
                  </span>
                  <div className="text-sm text-white/80">Greenlight Readiness <span className="font-semibold">{greenlightPct}%</span></div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block" />
          </div>
        </section>

        {/* === VALUE (Why Mission Control) – ดาร์กอ่อน === */}
        <section id="value" className="section-dark py-14 lg:py-20">
          <div className="cosmic-stars" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">ทำไมต้อง Bizzyztem Mission Control</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <ValueCard icon={<FolderClosed className="h-6 w-6" />} title="System Doc Hub">
                รวมแผน, SOP/WI, แบบฟอร์ม, นโยบาย, สัญญา, ใบอนุญาต—ศูนย์กลางเดียว ค้นง่าย แชร์ง่าย
              </ValueCard>
              <ValueCard icon={<CheckCircle2 className="h-6 w-6" />} title="Greenlight Readiness">
                ตัวชี้วัดความพร้อมของทั้งองค์กร—เอกสารครบ เจ้าภาพครบ ความเสี่ยงอยู่ในเกณฑ์
              </ValueCard>
              <ValueCard icon={<BadgeCheck className="h-6 w-6" />} title="Export-Ready Mission Report">
                สรุปสถานะภารกิจ + สารบัญเอกสารระบบในคลิกเดียว ใช้คุยกับบอร์ด/ธนาคาร/คู่ค้า
              </ValueCard>
            </div>

            {/* Trust bar */}
            <div className="mt-8 text-white/70 text-sm">
              ใช้งานโดยทีมธุรกิจไทยมากกว่า <span className="font-semibold text-white">2,400+</span> ทีม
            </div>
          </div>
        </section>

        {/* === PRODUCT SHOWCASE – ดาร์ก === */}
        <section id="product" className="section-dark py-14 lg:py-20">
          <div className="cosmic-stars" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold">Mission Control หน้าตาเป็นอย่างไร?</h2>
                <p className="text-white/70">ตัวอย่าง Dashboard และเอกสารระบบที่รวมไว้ศูนย์กลางเดียว</p>
              </div>
              <a href="/login" onClick={() => handleCta("product-cta")} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-white shadow-sm hover:bg-brand-700">
                เริ่มภารกิจ <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-sm">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={sampleData} outerRadius={110}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="cat" tick={{ fill: "#E5E7EB", fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#A3A3A3", fontSize: 10 }} />
                        <Radar name="คะแนน" dataKey="value" stroke="#2D7CFF" fill="#2D7CFF" fillOpacity={0.35} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-4">
                  {sampleData.map((d) => (<Progress key={d.cat} label={d.cat} value={d.value} />))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === FLIGHT PLAN (How it works) – ดาร์กเนียน === */}
        <section className="section-dark py-14 lg:py-20">
          <div className="cosmic-stars" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">แผนการบิน (Flight Plan)</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <StepCardDark no={1} title="ตั้งภารกิจ" desc="กำหนดเป้าหมาย/เจ้าภาพ/ETA และแบ่งเฟสบิน" />
              <StepCardDark no={2} title="รวม Mission Docs" desc="รวบเอกสารระบบทั้งหมดไว้ศูนย์กลางเดียว" />
              <StepCardDark no={3} title="ดาวน์โหลด Mission Report" desc="สรุปสถานะ + สารบัญเอกสารระบบในคลิกเดียว" />
            </div>
            <div className="mt-8">
              <a href="/login" onClick={() => handleCta("howto-cta")} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-white text-base font-medium shadow-sm hover:bg-brand-700">
                เริ่มภารกิจ <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        </section>

        {/* === CREW & ROLES – ดาร์ก === */}
        <section id="roles" className="section-dark py-14 lg:py-20">
          <div className="cosmic-stars" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">ลูกเรือ & บทบาทบนยาน</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              <RoleCard icon={<Crown className="h-5 w-5" />} title="Captain" desc="Strategy" />
              <RoleCard icon={<Compass className="h-5 w-5" />} title="Navigation" desc="Org" />
              <RoleCard icon={<Cog className="h-5 w-5" />} title="Propulsion" desc="SOP" />
              <RoleCard icon={<Users2 className="h-5 w-5" />} title="Crew Care" desc="HR" />
              <RoleCard icon={<Wallet className="h-5 w-5" />} title="Fuel" desc="Finance" />
              <RoleCard icon={<Megaphone className="h-5 w-5" />} title="Comms" desc="Sales" />
            </div>
            <p className="mt-4 text-sm text-white/70">
              สิทธิ์เข้าถึงแบบรายบทบาท: Owner / Manager / Reviewer / Approver
            </p>
          </div>
        </section>

        {/* === MISSION LOGS (Testimonials) – ดาร์กกึ่งกลาง === */}
        <section className="section-dark py-14 lg:py-20">
          <div className="cosmic-stars" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">บันทึกภารกิจ (Mission Logs)</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <TestimonialDark quote="เห็นภาพรวมทั้งองค์กรในเวลาไม่กี่นาที—จัดลำดับสิ่งที่ต้องทำได้ทันที" author="คุณกิตติ – โรงงานอาหาร" />
              <TestimonialDark quote="Export Mission Report เอาไปคุยบอร์ดได้เลย ลดเวลาจัดเตรียมเอกสาร" author="คุณนภ – ซอฟต์แวร์เฮาส์" />
              <TestimonialDark quote="คะแนน + คำแนะนำช่วยให้ทีมโฟกัสช่องว่างสำคัญ ส่งผลต่อยอดขายจริง" author="คุณพร – ผู้จัดการฝ่ายขาย" />
            </div>
          </div>
        </section>

        {/* === PRICING – ดาร์กหรู === */}
        <section id="pricing" className="section-dark py-14 lg:py-20">
          <div className="cosmic-stars" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-8">เริ่มฟรี – อัปเกรดเมื่อต้องการ</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <PricingCard
                tier="Crew (Free)"
                desc={["ตั้งภารกิจ 3 รายการ", "อัปโหลด Mission Docs", "ดูสรุปเบื้องต้น"]}
                cta="เริ่มใช้ฟรี"
                onClick={() => (window.location.href = "/login")}
              />
              <PricingCard
                highlight
                tier="Pilot (Pro)"
                desc={["Approver / Reviewer", "Alerts", "ดาวน์โหลด Mission Report ไม่จำกัด", "ทีม 5 ที่นั่ง"]}
                cta="สนใจ Pro (ฝากคอนแทค)"
                onClick={() => openInterest("Pro")}
              />
              <PricingCard
                tier="Commander (Add-on)"
                desc={["Filing / IPO Pack", "Data Room (Lite)", "สิทธิ์ขั้นสูง", "ทีม 15 ที่นั่ง"]}
                cta="สนใจ Add-on (ฝากคอนแทค)"
                onClick={() => openInterest("Premium")}
              />
            </div>
          </div>
        </section>

        {/* === FAQ – ดาร์กอ่อนอ่านสบาย === */}
        <section id="faq" className="section-light py-14 lg:py-20">
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6 text-white">คำถามที่พบบ่อย</h2>
            <FAQItem q="เริ่มยากไหม?" a="ตั้ง 3 ภารกิจ + อัปโหลดเอกสารระบบ 1 ชุด ก็เห็นสรุปได้ภายใน 10 นาที" />
            <FAQItem q="ข้อมูลปลอดภัยหรือไม่?" a="เข้ารหัสและสิทธิ์เข้าถึงแบบรายบทบาท (Role-based) เฉพาะผู้ที่ได้รับมอบหมาย" />
            <FAQItem q="ใครเห็นอะไรได้บ้าง?" a="Owner / Manager / Reviewer / Approver ตั้งสิทธิ์ตามบทบาทได้" />
            <FAQItem q="รายงานส่งให้ใครบ้างได้?" a="แชร์ลิงก์ที่มีวันหมดอายุ หรือดาวน์โหลดเป็น PDF (Mission Report)" />
          </div>
        </section>

        {/* === Final CTA – พร้อมปล่อยยาน === */}
        <section className="py-16 bg-gradient-to-br from-[#0B1220] to-[#0E1A2F] border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-2xl font-bold mb-2">พร้อมปล่อยยานของคุณหรือยัง?</h3>
            <p className="text-white/70 mb-6">รวมเอกสารระบบ • วัดระยะ Distance to Moon • สรุปรายงานในคลิกเดียว</p>
            <a href="/login" onClick={() => handleCta("footer")} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-white text-base font-medium shadow-sm hover:bg-brand-700">
              เริ่มภารกิจ <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 bg-[#0B1220]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-sm text-white/70 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>© {new Date().getFullYear()} Bizzyztem • Mission to the Moon</div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile sticky CTA (เฉพาะจอเล็ก) */}
      <div className="fixed bottom-4 inset-x-0 px-4 sm:hidden z-40">
        <a href="/login" onClick={() => handleCta("mobile-sticky")} className="block text-center rounded-2xl bg-brand-600 py-3 text-white font-medium shadow-lg shadow-black/30">
          เริ่มภารกิจฟรี
        </a>
      </div>

      {/* Interest Modal */}
      <InterestModal open={interestOpen} onClose={() => setInterestOpen(false)} initialPlan={initialPlan} />
    </>
  );
}

/* ====== Cards & Components (Dark variants) ====== */
function ValueCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-sm">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">{icon}</div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-white/80">{children}</p>
    </div>
  );
}

function StepCardDark({ no, title, desc }: { no: number; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-sm">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-sm font-semibold">{no}</div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-white/80">{desc}</p>
    </div>
  );
}

function RoleCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-sm text-center">
      <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">{icon}</div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-white/70">{desc}</div>
    </div>
  );
}

function TestimonialDark({ quote, author }: { quote: string; author: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-sm">
      <p className="text-white">“{quote}”</p>
      <div className="mt-3 text-sm text-white/70">— {author}</div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-white/10 py-4">
      <summary className="cursor-pointer list-none flex items-center justify-between text-white font-medium">
        {q}
        <span className="transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <p className="mt-2 text-white/80 text-sm">{a}</p>
    </details>
  );
}

function PricingCard({
  tier, desc, cta, onClick, highlight,
}: {
  tier: string;
  desc: string[];
  cta: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-6 shadow-sm flex flex-col border ${highlight ? "border-brand-500 ring-2 ring-brand-300/30" : "border-white/10"} bg-white/[0.06]`}>
      <div className="text-sm font-medium text-white/80">{tier}</div>
      <ul className="mt-3 space-y-2 text-sm text-white/80">
        {desc.map((d, i) => (<li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-brand-400 mt-0.5" />{d}</li>))}
      </ul>
      <button onClick={onClick} className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl ${highlight ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-white/20 bg-white/0 text-white hover:bg-white/10"} px-4 py-2`}>
        {cta} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ==== Interest Modal (เดิม) ==== */
function InterestModal({ open, onClose, initialPlan }: { open: boolean; onClose: () => void; initialPlan: "Pro" | "Premium" }) {
  const [plan, setPlan] = useState<"Pro" | "Premium">(initialPlan);
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); const [company, setCompany] = useState("");
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => { setPlan(initialPlan); }, [initialPlan]);
  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      track("pricing_interest", { plan, name, email, phone, company });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-lg rounded-2xl bg-[#0B1220] text-white p-6 shadow-xl border border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">ลงทะเบียนความสนใจแพ็กเกจ {plan}</h3>
          <button className="rounded-full p-1 hover:bg-white/10" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-white/80" />
          </button>
        </div>

        {submitted ? (
          <div className="mt-4">
            <p className="text-white/80">รับเรื่องเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด ขอบคุณครับ 🙏</p>
            <div className="mt-6 text-right">
              <button className="rounded-xl bg-brand-600 px-4 py-2 text-white hover:bg-brand-700" onClick={onClose}>ปิดหน้าต่าง</button>
            </div>
          </div>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <div>
              <label className="text-sm text-white/80">แพ็กเกจที่สนใจ</label>
              <select className="mt-1 w-full rounded-xl border border-white/20 bg-white/0 px-3 py-2" value={plan} onChange={(e) => setPlan(e.target.value as any)}>
                <option value="Pro">Pro</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/80">ชื่อ-นามสกุล</label>
                <input className="mt-1 w-full rounded-xl border border-white/20 bg-white/0 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm text-white/80">เบอร์โทร</label>
                <input className="mt-1 w-full rounded-xl border border-white/20 bg-white/0 px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm text-white/80">อีเมล</label>
              <input type="email" className="mt-1 w-full rounded-xl border border-white/20 bg-white/0 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm text-white/80">บริษัท</label>
              <input className="mt-1 w-full rounded-xl border border-white/20 bg-white/0 px-3 py-2" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <input type="text" className="hidden" autoComplete="off" tabIndex={-1} aria-hidden />
            <div className="pt-2 text-right">
              <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
                ส่งข้อมูลความสนใจ
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
