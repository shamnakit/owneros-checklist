// src/components/checklist/StatusChip.tsx
import React from "react";
import type { StatusKey } from "@/theme/moonship";

export default function StatusChip({ status }: { status: StatusKey }) {
  const cls = status === "GO" ? "chip chip-go" : status === "HOLD" ? "chip chip-hold" : "chip chip-nogo";
  return <span className={cls}>● {status}</span>;
}
