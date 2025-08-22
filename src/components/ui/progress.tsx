import * as React from "react";

export function Progress({
  value = 0,
  className = "",
}: {
  value?: number;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-3 w-full rounded-full bg-slate-200 ${className}`}>
      <div
        className="h-3 rounded-full bg-blue-600 transition-all"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export default Progress;
