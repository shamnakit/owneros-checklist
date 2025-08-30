// src/hooks/useCanEdit.ts
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'

export function useCanEdit(projectTable: 'filing_projects'|'pre_filing_projects', projectId: string | null) {
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) { setCanEdit(false); setLoading(false); return }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCanEdit(false); setLoading(false); return }

      const { data: project } = await supabase
        .from(projectTable)
        .select('id, company_id, created_by')
        .eq('id', projectId)
        .maybeSingle()
      if (!project) { setCanEdit(false); setLoading(false); return }

      if (project.created_by === user.id) { setCanEdit(true); setLoading(false); return }

      const { data: member } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', project.company_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()
      const allowed = member?.role === 'owner' || member?.role === 'admin'
      if (!cancelled) { setCanEdit(allowed); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [projectTable, projectId])

  return { canEdit, loading }
}
