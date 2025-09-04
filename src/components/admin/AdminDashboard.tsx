// src/components/admin/AdminDashboard.tsx
import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShieldCheck,
  LineChart as IconLineChart,
  FolderLock,
  Bell,
  Download,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Settings,
  Activity,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RTooltip,
  Legend,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

/** ------- Demo data (แทนที่ด้วยข้อมูลจริงภายหลัง) ------- */
const radarData = [
  { name: 'กลยุทธ์', score: 82 },
  { name: 'โครงสร้าง', score: 76 },
  { name: 'คู่มือ/SOP', score: 68 },
  { name: 'บุคคล/HR', score: 74 },
  { name: 'การเงิน', score: 63 },
  { name: 'ลูกค้า/ขาย', score: 71 },
];

const progressQualityPoints = [
  { x: 88, y: 86, name: 'รวมองค์กร' },
  { x: 92, y: 68, name: 'โครงสร้าง' },
  { x: 74, y: 61, name: 'การเงิน' },
  { x: 79, y: 72, name: 'ลูกค้า/ขาย' },
  { x: 83, y: 65, name: 'SOP' },
];

const evidenceRows = [
  { id: 'EV-1204', module: 'การเงิน', file: 'Cashflow_Apr-Sep_2025.pdf', by: 'CFO', date: '2025-09-03', status: 'ขาดเอกสารเสริม' },
  { id: 'EV-1205', module: 'โครงสร้าง', file: 'OrgChart_v6.png', by: 'HR', date: '2025-09-02', status: 'ครบถ้วน' },
  { id: 'EV-1206', module: 'SOP', file: 'SOP_Sales_3.2.docx', by: 'Ops', date: '2025-09-01', status: 'รออนุมัติ' },
  { id: 'EV-1210', module: 'ลูกค้า/ขาย', file: 'NPS_Q3.xlsx', by: 'CS', date: '2025-09-01', status: 'ครบถ้วน' },
];

const overdueTasks = [
  { id: 'OD-007', title: 'MD&A H1/2025 (ฉบับทบทวน)', owner: 'CFO', due: '2025-09-05' },
  { id: 'OD-011', title: 'Policy จริยธรรม – รับทราบประจำปี', owner: 'HR', due: '2025-09-06' },
];

const auditLogs = [
  { ts: '2025-09-04 10:12', actor: 'Reviewer (FA)', action: 'Approve Evidence', target: 'SOP_Sales_3.2.docx', from: 'รออนุมัติ', to: 'อนุมัติ' },
  { ts: '2025-09-04 09:48', actor: 'CEO', action: 'Export Binder', target: 'Owner Readiness (PDF)', from: 'v1.8', to: 'v1.9' },
  { ts: '2025-09-03 16:21', actor: 'CFO', action: 'Upload Evidence', target: 'Cashflow_Apr-Sep_2025.pdf', from: '—', to: 'อัปโหลดแล้ว' },
];

const users = [
  { name: 'CEO (Owner)', role: 'Owner', email: 'ceo@company.co', status: 'Active' },
  { name: 'CFO', role: 'Member', email: 'cfo@company.co', status: 'Active' },
  { name: 'HR Lead', role: 'Member', email: 'hr@company.co', status: 'Active' },
  { name: 'FA / Legal', role: 'External Reviewer', email: 'fa@advisor.co', status: 'Read-only' },
];

/** ------- UI helpers ------- */
function StatCard({
  icon: Icon,
  title,
  value,
  trend,
  note,
  accent = 'from-blue-500 to-indigo-500',
}: {
  icon: any;
  title: string;
  value: string;
  trend: string;
  note?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl p-4 bg-white/90 dark:bg-zinc-900 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <TrendingUp className="h-4 w-4 text-emerald-600" />
        <span className="text-zinc-600 dark:text-zinc-300">{trend}</span>
      </div>
      {note ? <p className="mt-2 text-xs text-zinc-500">{note}</p> : null}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: any;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/90 dark:bg-zinc-900 ring-1 ring-black/5 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Icon className="h-4 w-4 text-zinc-600" />
          </div>
          <h3 className="font-medium">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800">
      {children}
    </kbd>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: any; label: string; active?: boolean }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
        active
          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

/** ------- Main component ------- */
export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      {/* Topbar */}
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-zinc-900/60 bg-white/90 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600" />
            <div className="text-sm leading-tight">
              <div className="font-semibold tracking-tight">Bizsystem Admin</div>
              <div className="text-xs text-zinc-500">Evidence-First • Investor-Ready</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <input
                placeholder="ค้นหา ( / )"
                className="w-72 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <div className="absolute right-2 top-1.5">
                <Kbd>/</Kbd>
              </div>
            </div>
            <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Settings className="h-5 w-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-rose-500" />
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="mx-auto max-w-7xl px-5 py-6 grid grid-cols-12 gap-5">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3 space-y-2">
          <NavItem icon={LayoutDashboard} label="Dashboard (ภาพรวม)" active />
          <NavItem icon={Users} label="ผู้ใช้ & สิทธิ์ (RBAC)" />
          <NavItem icon={FileText} label="Evidence Monitor" />
          <NavItem icon={ShieldCheck} label="Workflow & Approvals" />
          <NavItem icon={FolderLock} label="Data Room" />
          <NavItem icon={IconLineChart} label="KPI & Scoring" />
          <NavItem icon={Activity} label="Audit Log" />
          <NavItem icon={Database} label="Exports & Binder" />
          <NavItem icon={Settings} label="Billing (แผน/การใช้งาน)" />

          {/* Monetization CTA */}
          <div className="mt-4 rounded-2xl p-4 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm">
            <div className="text-sm/5 font-medium">อัปเกรดเป็น Business</div>
            <p className="text-xs/5 opacity-90 mt-1">เปิด Data Room, Reviewer Workflow, Export DOCX/PDF ไม่จำกัด</p>
            <button className="mt-3 inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
              ดูแพ็กเกจ <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 lg:col-span-9 space-y-5">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={ShieldCheck} title="Readiness (รวม)" value="78%" trend="↑ +4% MoM" note="เป้าหมาย 85% ภายใน Q4/2025" />
            <StatCard icon={FileText} title="Evidence Rate" value="72%" trend="↑ +6% MoM" accent="from-emerald-500 to-teal-500" note="SOP/Finance ต่ำกว่าค่าเฉลี่ย" />
            <StatCard icon={Download} title="Exports (30 วัน)" value="12 ครั้ง" trend="↑ +3 ครั้ง" accent="from-sky-500 to-cyan-500" note="ล่าสุด: Owner Binder v1.9" />
            <StatCard icon={AlertTriangle} title="งานค้าง (Overdue)" value={`${overdueTasks.length} รายการ`} trend="↓ -2 รายการ" accent="from-rose-500 to-orange-500" note="เร่ง MD&A และ Policy" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Section
              title="Radar – คะแนนตามหมวด (6 หมวด)"
              icon={IconLineChart}
              action={
                <button className="text-sm rounded-lg px-2 py-1 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  ดูรายละเอียด
                </button>
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius={100}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="คะแนน" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
                    <Legend />
                    <RTooltip formatter={(v: any) => `${v}%`} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section
              title="Quadrant – Progress vs Quality"
              icon={IconLineChart}
              action={<div className="text-xs text-zinc-500">เป้าหมาย: Progress ≥ 80% • Score ≥ 70%</div>}
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="x" name="Progress %" domain={[50, 100]} />
                    <YAxis type="number" dataKey="y" name="Score %" domain={[50, 100]} />
                    <RTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number) => `${v}%`} />
                    <Legend />
                    <Scatter name="หมวด" data={progressQualityPoints} fill="#10b981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>

          {/* Evidence & Workflow */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Section
              title="Evidence Monitor"
              icon={FileText}
              action={
                <button className="text-sm rounded-lg px-2 py-1 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  ส่งออกรายการ
                </button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500">
                      <th className="py-2">ID</th>
                      <th>หมวด</th>
                      <th>ไฟล์</th>
                      <th>โดย</th>
                      <th>วันที่</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidenceRows.map((row) => (
                      <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="py-2 font-medium">{row.id}</td>
                        <td>{row.module}</td>
                        <td className="truncate max-w-[160px]">{row.file}</td>
                        <td>{row.by}</td>
                        <td>{row.date}</td>
                        <td>
                          {row.status === 'ครบถ้วน' && (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" /> ครบถ้วน
                            </span>
                          )}
                          {row.status === 'รออนุมัติ' && (
                            <span className="inline-flex items-center gap-1 text-amber-600">
                              <Clock className="h-4 w-4" /> รออนุมัติ
                            </span>
                          )}
                          {row.status === 'ขาดเอกสารเสริม' && (
                            <span className="inline-flex items-center gap-1 text-rose-600">
                              <AlertTriangle className="h-4 w-4" /> ขาดเอกสารเสริม
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {overdueTasks.map((t) => (
                  <div
                    key={t.id}
                    className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1 flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4 text-rose-600" /> {t.title}{' '}
                    <span className="text-zinc-500">• Due {t.due}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Workflow & Approvals"
              icon={ShieldCheck}
              action={
                <button className="text-sm rounded-lg px-2 py-1 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  ตั้งค่า Reviewer
                </button>
              }
            >
              <ol className="space-y-4">
                {[
                  { step: 1, label: 'Submit', by: 'Member', note: 'ส่งชุดเอกสารรอบ Q3' },
                  { step: 2, label: 'Review', by: 'Reviewer', note: 'ขอ MD&A ฉบับล่าสุด' },
                  { step: 3, label: 'Approve', by: 'Owner', note: 'อนุมัติออก Binder v1.9' },
                ].map((w) => (
                  <li key={w.step} className="flex items-start gap-3">
                    <div className="mt-0.5 h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium">
                      {w.step}
                    </div>
                    <div>
                      <div className="font-medium">
                        {w.label} <span className="text-zinc-400">• {w.by}</span>
                      </div>
                      <div className="text-sm text-zinc-500">{w.note}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> สถานะล่าสุด: <b>Approve</b> • พร้อม Export
                </div>
                <button className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-1.5 text-sm">
                  <Download className="h-4 w-4" /> Export Binder (PDF/DOCX)
                </button>
              </div>
            </Section>
          </div>

          {/* Audit Log + Users & Data Room snapshot */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Section title="Audit Log" icon={Activity} action={<span className="text-xs text-zinc-500">แสดง 30 รายการล่าสุด</span>}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500">
                      <th className="py-2">เวลา</th>
                      <th>ผู้ใช้</th>
                      <th>การกระทำ</th>
                      <th>เป้าหมาย</th>
                      <th>จาก</th>
                      <th>เป็น</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((l, idx) => (
                      <tr key={idx} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">{l.ts}</td>
                        <td>{l.actor}</td>
                        <td>{l.action}</td>
                        <td className="truncate max-w-[180px]">{l.target}</td>
                        <td>{l.from}</td>
                        <td>{l.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section
              title="ผู้ใช้ & สิทธิ์ (RBAC)"
              icon={Users}
              action={
                <button className="text-sm rounded-lg px-2 py-1 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  เชิญผู้ใช้
                </button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500">
                      <th className="py-2">ชื่อ</th>
                      <th>บทบาท</th>
                      <th>อีเมล</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={idx} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="py-2 font-medium">{u.name}</td>
                        <td>{u.role}</td>
                        <td>{u.email}</td>
                        <td>{u.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Data Room Snapshot */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { name: 'Strategy', perm: 'Owner/Reviewer' },
                  { name: 'Finance', perm: 'Owner/CFO/Reviewer' },
                  { name: 'HR', perm: 'Owner/HR' },
                  { name: 'SOP', perm: 'Owner/Ops/Reviewer' },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FolderLock className="h-4 w-4" /> {f.name}
                    </div>
                    <span className="text-xs text-zinc-500">{f.perm}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-5 py-3 text-xs text-zinc-500 flex items-center justify-between">
          <span>© 2025 Bizsystem • Admin Mockup v0.1</span>
          <span>Design: Professional • Investor-Ready • Evidence-First</span>
        </div>
      </footer>
    </div>
  );
}
