import { CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import React from "react";

export type RevenueBandValue =
  | "UNDER_10M"
  | "10_49M"
  | "50_99M"
  | "100_499M"
  | "500_999M"
  | "1B_PLUS"
  | "NOT_DISCLOSED";

const OPTIONS: { value: RevenueBandValue; label: string; hint?: string }[] = [
  { value: "UNDER_10M", label: "< 10 ล้านบาท/ปี" },
  { value: "10_49M", label: "10 – 49 ล้านบาท/ปี" },
  { value: "50_99M", label: "50 – 99 ล้านบาท/ปี" },
  { value: "100_499M", label: "100 – 499 ล้านบาท/ปี" },
  { value: "500_999M", label: "500 – 999 ล้านบาท/ปี" },
  { value: "1B_PLUS", label: "≥ 1,000 ล้านบาท/ปี" },
  // { value: "NOT_DISCLOSED", label: "ไม่เปิดเผย", hint: "จะไม่ใช้ใน Benchmark" },
];

type Props = {
  value?: RevenueBandValue | null;
  onChange: (val: RevenueBandValue) => void;
  disabled?: boolean;
  className?: string;
};

export default function RevenueBandSelector({
  value,
  onChange,
  disabled,
  className,
}: Props) {
  return (
    <div className={clsx("space-y-2", className)}>
      <div className="text-sm text-gray-600">
        เลือกช่วงยอดขายต่อปี (ใช้สำหรับ Benchmark และรายงาน)
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={clsx(
                "relative w-full rounded-2xl border p-4 text-left transition",
                "hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                selected
                  ? "border-emerald-500 ring-emerald-500/20 bg-emerald-50/50"
                  : "border-gray-200 bg-white",
                disabled && "opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{opt.label}</div>
                  {opt.hint && (
                    <div className="text-xs text-gray-500 mt-1">{opt.hint}</div>
                  )}
                </div>

                <CheckCircle2
                  className={clsx(
                    "h-5 w-5 transition",
                    selected ? "text-emerald-600 opacity-100" : "opacity-0"
                  )}
                />
              </div>
            </button>
          );
        })}
      </div>

      {!value && (
        <div className="text-xs text-amber-600 mt-1">
          *ยังไม่เลือก สามารถเลือกภายหลังได้
        </div>
      )}

      {value && (
        <div className="inline-flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          เลือกแล้ว: <span className="font-medium">{labelFromValue(value)}</span>
        </div>
      )}
    </div>
  );
}

export function labelFromValue(val: RevenueBandValue | null | undefined) {
  const f = OPTIONS.find((o) => o.value === val);
  return f?.label ?? "-";
}
