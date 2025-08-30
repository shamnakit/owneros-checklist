// src/contexts/YearContext.tsx
'use client'
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'

type Ctx = { selectedYear: number; setSelectedYear: (y: number) => void }
const YearContext = createContext<Ctx | undefined>(undefined)

function getInitialYear(): number {
  if (typeof window !== 'undefined') {
    const u = new URL(window.location.href)
    const q = u.searchParams.get('year')
    if (q && /^\d{4}$/.test(q)) return parseInt(q, 10)
    const remembered = window.localStorage.getItem('owneros:selectedYear')
    if (remembered && /^\d{4}$/.test(remembered)) return parseInt(remembered, 10)
  }
  return new Date().getFullYear()
}

export const YearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedYear, setYear] = useState<number>(getInitialYear())

  const setSelectedYear = (y: number) => {
    setYear(y)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('year', String(y))
      window.history.replaceState({}, '', url.toString())
      window.localStorage.setItem('owneros:selectedYear', String(y))
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (!url.searchParams.get('year')) {
        url.searchParams.set('year', String(selectedYear))
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [])

  const value = useMemo(() => ({ selectedYear, setSelectedYear }), [selectedYear])
  return <YearContext.Provider value={value}>{children}</YearContext.Provider>
}

export const useYear = () => {
  const ctx = useContext(YearContext)
  if (!ctx) throw new Error('useYear must be used within YearProvider')
  return ctx
}
