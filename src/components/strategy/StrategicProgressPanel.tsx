// src/components/strategy/StrategicProgressPanel.tsx

import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";

// MOCK Type และ Data สำหรับ OKR/Strategic Initiatives
export type StrategicInitiative = {
  id: string;
  objective: string;
  metric: string;
  current: number;
  target: number;
  unit: 'PCT' | 'COUNT' | 'THB';
  status: 'on_track' | 'at_risk' | 'behind';
  dueDate: string; // YYYY-MM-DD
};

const mockInitiatives: StrategicInitiative[] = [
  {
    id: 'o01', objective: 'เพิ่มรายได้จากผลิตภัณฑ์ใหม่ 30%',
    metric: 'New Rev %', current: 22, target: 30, unit: 'PCT', 
    status: 'at_risk', dueDate: '2025-12-31'
  },
  {
    id: 'o02', objective: 'เปิดตัว/เข้าสู่ตลาด Asean (Phase 1)',
    metric: 'Market Entry Milestones', current: 3, target: 5, unit: 'COUNT', 
    status: 'on_track', dueDate: '2025-09-30'
  },
  {
    id: 'o03', objective: 'ลดต้นทุนการดำเนินงาน (OPEX) ลง 8%',
    metric: 'OPEX Reduction %', current: 4.5, target: 8, unit: 'PCT', 
    status: 'behind', dueDate: '2025-12-31'
  },
];

// Helper Functions
function statusLabel(s: StrategicInitiative['status']) {
  if (s === 'on_track') return "On Track";
  if (s === 'at_risk') return "At Risk";
  return "Behind";
}

function statusColor(s: StrategicInitiative['status']) {
  // ใช้สีจาก globals.css
  if (s === 'on_track') return "var(--success)";
  if (s === 'at_risk') return "var(--warning)";
  return "var(--danger)";
}

function calculateProgress(item: StrategicInitiative) {
    if (item.target === 0) return 0;
    // ป้องกันไม่ให้เกิน 100%
    return Math.min(100, (item.current / item.target) * 100);
}

// Mock component for illustration (ควรย้ายไปที่ src/components/ui/ProgressBar.tsx)
function ProgressBar({ progress, color }: { progress: number, color: string }) {
    return (
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--panel-2)' }}>
            <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ width: `${progress}%`, background: color }} 
            />
        </div>
    );
}

// ====================== StrategicProgressPanel Component ======================

export function StrategicProgressPanel() {
  const atRiskCount = mockInitiatives.filter(a => a.status !== 'on_track').length;
  
  return (
    <div className="panel-dark p-5 h-full flex flex-col">
      <div className="panel-title flex items-center justify-between mb-4">
        <div className="flex items-center gap-2" style={{ color: 'var(--accent)' }}>
          <Target size={20} />
          <span>ความคืบหน้าเป้าหมายเชิงกลยุทธ์ (OKRs)</span>
        </div>
        <span
          className="text-sm font-medium rounded-full px-3 py-1"
          style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
        >
          {atRiskCount} At-Risk
        </span>
      </div>
      
      <div className="space-y-4 flex-grow">
        {mockInitiatives.map((item) => {
          const progress = calculateProgress(item);
          const color = statusColor(item.status);
          const label = statusLabel(item.status);

          return (
            <div key={item.id} className="p-3 rounded-lg border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-[var(--text-1)]">{item.objective}</div>
                <div 
                    className="text-xs font-semibold px-2 rounded-full" // ใช้ rounded-full เพื่อให้เป็น Tag
                    style={{ 
                        color: color, 
                        background: `color-mix(in srgb, ${color} 15%, transparent)`
                    }}
                >
                    {label}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ProgressBar progress={progress} color={color} />
                <span className="text-sm muted whitespace-nowrap">{Math.round(progress)}%</span>
              </div>
              
              <div className="flex justify-between items-center pt-1">
                <div className="text-xs muted">
                    {item.current}{item.unit === 'PCT' ? '%' : ''} / {item.target}{item.unit === 'PCT' ? '%' : ''} ({item.metric})
                </div>
                <Link href={`/okrs/${item.id}`} className="text-xs flex items-center gap-1 hover:text-[var(--accent)]" style={{ color: 'var(--text-2)' }}>
                    รายละเอียด <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <Link href={`/okrs`} className="btn-outline inline-flex items-center gap-2 w-full justify-center">
          View All Initiatives <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}