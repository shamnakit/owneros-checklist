// src/hooks/useEnsureProjectsForYear.ts
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClients'

export function useEnsureProjectsForYear(companyId: string | null, year: number) {
  const [filingProjectId, setFilingProjectId] = useState<string | null>(null)
  const [preFilingProjectId, setPreFilingProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId || !year) return
    let cancelled = false
    ;(async () => {
      setLoading(true); setError(null)

      const { data: filingId, error: filingErr } = await supabase
        .rpc('upsert_filing_project', { _company_id: companyId, _target_year: year, _status: 'draft' })
      if (filingErr) { setError(filingErr.message); setLoading(false); return }

      const { data: prefId, error: prefErr } = await supabase
        .rpc('upsert_pre_filing_project', { _company_id: companyId, _year: year, _status: 'draft' })
      if (prefErr) { setError(prefErr.message); setLoading(false); return }

      if (!cancelled) { setFilingProjectId(filingId ?? null); setPreFilingProjectId(prefId ?? null); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [companyId, year])

  return { filingProjectId, preFilingProjectId, loading, error }
}
