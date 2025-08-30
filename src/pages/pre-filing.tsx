// src/pages/pre-filing.tsx
'use client'
import YearPicker from '@/components/ui/YearPicker'
import { useYear } from '@/contexts/Yearcontext'
import { useCompanyId } from '@/hooks/useCompanyId'
import { useEnsureProjectsForYear } from '@/hooks/useEnsureProjectsForYear'
import { useCanEdit } from '@/hooks/useCanEdit'

export default function PreFilingPage() {
  const { selectedYear } = useYear()
  const { companyId } = useCompanyId()
  const { preFilingProjectId } = useEnsureProjectsForYear(companyId, selectedYear)
  const { canEdit } = useCanEdit('pre_filing_projects', preFilingProjectId)

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pre-Filing</h1>
        <YearPicker />
      </div>
      <div className="border rounded p-4 space-y-3">
        <div className="text-sm text-gray-600">Project ID: {preFilingProjectId ?? '…'}</div>
        <button
          className={`px-4 py-2 rounded ${canEdit ? 'bg-black text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
          disabled={!canEdit}
        >
          {canEdit ? 'Edit Pre-Filing Details' : 'Read-only (owner/admin/creator only)'}
        </button>
      </div>
    </main>
  )
}
