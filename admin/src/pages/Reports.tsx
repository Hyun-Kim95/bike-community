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
  targetTitle?: string
  targetContentPreview?: string
}

interface ReportDetail extends Report {
  targetTitle?: string
  targetContent?: string
}

const REPORT_STATUS_OPTIONS = [
  { value: 'pending', label: '접수' },
  { value: 'under_review', label: '검토중' },
  { value: 'resolved', label: '조치완료' },
  { value: 'rejected', label: '반려' },
] as const

function reportStatusLabel(value: string): string {
  return REPORT_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  post: '게시글',
  comment: '댓글',
  marketplace_item: '거래글',
}
function targetTypeLabel(value: string): string {
  return TARGET_TYPE_LABELS[value] ?? value
}

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
  const [editReport, setEditReport] = useState<ReportDetail | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editAdminNote, setEditAdminNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)

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

  const openEdit = async (r: Report) => {
    setEditReport({ ...r })
    setEditStatus(r.status)
    setEditAdminNote(r.adminNote ?? '')
    setError('')
    setDetailLoading(true)
    try {
      const detail = await api<ReportDetail>(`/admin/reports/${r.id}`)
      if (detail && !('error' in detail)) {
        setEditReport((prev) => prev ? { ...prev, targetTitle: detail.targetTitle, targetContent: detail.targetContent } : null)
      }
    } catch {
      // keep editReport with list item data
    } finally {
      setDetailLoading(false)
    }
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

  const filterBar = 'rounded-xl border border-border bg-muted/10 p-4 mb-4'
  const filterLabel = 'text-xs font-medium text-muted-foreground mb-1.5 block'
  const filterInput = 'rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent'

  return (
    <div>
      <h1 className={pageTitle}>신고 처리</h1>
      <div className={filterBar}>
        <label className={filterLabel}>상태</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${filterInput} w-40`}>
          <option value="">전체</option>
          {REPORT_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="text-muted-foreground">로딩 중...</div>
      ) : (
        <table className={tableWrap}>
          <thead className={tableHead}>
            <tr>
              <th className={th}>대상</th>
              <th className={th}>신고한 대상 내용</th>
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
                <td className={td}>{targetTypeLabel(r.targetType)}</td>
                <td className={`${td} max-w-[280px]`} title={[r.targetTitle, r.targetContentPreview].filter(Boolean).join(' / ') || undefined}>
                  <span className="line-clamp-2 text-sm text-foreground">
                    {r.targetTitle ? (
                      <>
                        <span className="font-medium block truncate">{r.targetTitle}</span>
                        {r.targetContentPreview && <span className="text-muted-foreground">{r.targetContentPreview}</span>}
                      </>
                    ) : (
                      (r.targetContentPreview || '-')
                    )}
                  </span>
                </td>
                <td className={td}>{r.reason ?? '-'}</td>
                <td className={td}>{r.reporter?.nickname ?? '-'}</td>
                <td className={td}>{reportStatusLabel(r.status)}</td>
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
          <div className={`${modalPanel} max-w-[560px] max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mt-0 mb-2">신고 처리</h2>
            <p className="mb-2 text-sm text-muted-foreground">
              대상: {targetTypeLabel(editReport.targetType)} · 사유: {editReport.reason ?? '-'}
            </p>
            {editReport.detail && (
              <p className="mb-2 text-sm text-foreground">
                <span className="font-medium text-muted-foreground">신고자 작성 내용: </span>
                {editReport.detail}
              </p>
            )}
            {detailLoading ? (
              <p className="text-sm text-muted-foreground mb-4">대상 내용 불러오는 중...</p>
            ) : (editReport.targetTitle != null || editReport.targetContent != null) ? (
              <div className="mb-4 rounded border border-border bg-muted/20 p-3 text-sm">
                <p className="font-medium text-muted-foreground mb-1">신고된 대상 내용</p>
                {editReport.targetTitle != null && (
                  <p className="font-medium mb-1">{editReport.targetTitle}</p>
                )}
                <div className="whitespace-pre-wrap break-words text-foreground">
                  {(editReport.targetContent ?? '(내용 없음)').slice(0, 1000)}
                  {(editReport.targetContent ?? '').length > 1000 && '…'}
                </div>
              </div>
            ) : null}
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
