import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

interface Report {
  id: string
  targetType: string
  targetId: string
  reason: string | null
  detail: string | null
  status: string
  adminNote: string | null
  createdAt: string
  reporter?: { nickname: string }
}

const REPORT_STATUS_OPTIONS = [
  { value: 'pending', label: '접수' },
  { value: 'under_review', label: '검토중' },
  { value: 'resolved', label: '조치완료' },
  { value: 'rejected', label: '반려' },
] as const

const pageTitle = 'text-2xl font-semibold text-foreground mb-4'
const tableWrap = 'w-full border-collapse rounded-lg border border-border overflow-hidden'
const tableHead = 'border-b border-border bg-muted/50 text-left text-sm font-medium text-foreground'
const th = 'p-3'
const tableBody = 'bg-card text-card-foreground'
const td = 'p-3 border-b border-border'
const inputBase = 'w-full p-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
const btn = 'py-2 px-3 rounded-md font-medium cursor-pointer transition-opacity disabled:opacity-60 disabled:cursor-not-allowed'
const btnPrimary = 'bg-primary text-primary-foreground hover:opacity-90 ' + btn
const btnSecondary = 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border ' + btn
const modalOverlay = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]'
const modalPanel = 'bg-card text-card-foreground p-6 rounded-lg shadow-lg border border-border min-w-[360px] max-w-[90%]'

export function Reports() {
  const [items, setItems] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [editReport, setEditReport] = useState<Report | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editAdminNote, setEditAdminNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchList = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: '1', limit: '30' })
    if (status) params.set('status', status)
    api<{ items: Report[] }>(`/admin/reports?${params}`)
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const openEdit = (r: Report) => {
    setEditReport(r)
    setEditStatus(r.status)
    setEditAdminNote(r.adminNote ?? '')
    setError('')
  }

  const saveEdit = async () => {
    if (!editReport) return
    setSaving(true)
    setError('')
    try {
      await api(`/admin/reports/${editReport.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: editStatus, adminNote: editAdminNote.trim() || undefined }),
      })
      setEditReport(null)
      fetchList()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className={pageTitle}>신고 처리</h1>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputBase} mb-4 w-48`}>
        <option value="">전체</option>
        {REPORT_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {loading ? (
        <div className="text-muted-foreground">로딩 중...</div>
      ) : (
        <table className={tableWrap}>
          <thead className={tableHead}>
            <tr>
              <th className={th}>대상</th>
              <th className={th}>사유</th>
              <th className={th}>신고자</th>
              <th className={th}>상태</th>
              <th className={th}>접수일</th>
              <th className={th}>관리</th>
            </tr>
          </thead>
          <tbody className={tableBody}>
            {items.map((r) => (
              <tr key={r.id}>
                <td className={td}>{r.targetType} / {r.targetId.slice(0, 8)}...</td>
                <td className={td}>{r.reason ?? '-'}</td>
                <td className={td}>{r.reporter?.nickname ?? '-'}</td>
                <td className={td}>{r.status}</td>
                <td className={td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className={td}>
                  <button type="button" className={`${btnSecondary} text-sm`} onClick={() => openEdit(r)}>처리</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editReport && (
        <div className={modalOverlay} onClick={() => !saving && setEditReport(null)}>
          <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mt-0 mb-2">신고 처리</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              대상: {editReport.targetType} / {editReport.targetId.slice(0, 8)}... · 사유: {editReport.reason ?? '-'}
            </p>
            {error && <p className="text-destructive mb-3 text-sm">{error}</p>}
            <div className="mb-3">
              <label className="block mb-1 text-sm text-foreground">상태</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputBase}>
                {REPORT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm text-foreground">관리자 메모</label>
              <textarea value={editAdminNote} onChange={(e) => setEditAdminNote(e.target.value)} className={`${inputBase} min-h-[80px]`} placeholder="처리 내역 메모" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className={btnSecondary} onClick={() => setEditReport(null)} disabled={saving}>취소</button>
              <button type="button" className={btnPrimary} onClick={saveEdit} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
