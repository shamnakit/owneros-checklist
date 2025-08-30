// src/hooks/useCompanyId.ts
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClients'

export function useCompanyId() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)

      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) { setError(authErr?.message || 'Not authenticated'); setLoading(false); return }

      // หา company ที่ user เป็นสมาชิกอยู่แล้ว
      const { data: mem, error: memErr } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()

      if (memErr) { setError(memErr.message); setLoading(false); return }
      if (mem?.company_id) { if (!cancelled) { setCompanyId(mem.company_id); setLoading(false) } return }

      // ไม่มี → สร้างบริษัทใหม่ + ใส่เป็น owner (MVP)
      const companyName = (user.email?.split('@')[0] || 'Owner') + ' Co.'
      const { data: company, error: compErr } = await supabase
        .from('companies')
        .insert({ name: companyName, created_by: user.id })
        .select('id').single()
      if (compErr) { setError(compErr.message); setLoading(false); return }

      const { error: memInsErr } = await supabase
        .from('company_members')
        .insert({ company_id: company.id, user_id: user.id, role: 'owner', status: 'active' })
      if (memInsErr) { setError(memInsErr.message); setLoading(false); return }

      if (!cancelled) { setCompanyId(company.id); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  return { companyId, loading, error }
}
