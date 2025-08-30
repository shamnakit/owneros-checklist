// src/components/ui/YearPicker.tsx
'use client'
import React from 'react'
import { useYear } from '@/contexts/Yearcontext'

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

export default function YearPicker({ span = 3 }: { span?: number }) {
  const { selectedYear, setSelectedYear } = useYear()
  const now = new Date().getFullYear()
  const years = range(now - span, now + span)

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Year</label>
      <select
        className="border rounded-md px-3 py-2 text-sm"
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
