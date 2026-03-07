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
      <h1>신고 처리</h1>
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginBottom: 16, padding: 8 }}>
        <option value="">전체</option>
        {REPORT_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>대상</th>
              <th style={{ textAlign: 'left', padding: 8 }}>사유</th>
              <th style={{ textAlign: 'left', padding: 8 }}>신고자</th>
              <th style={{ textAlign: 'left', padding: 8 }}>상태</th>
              <th style={{ textAlign: 'left', padding: 8 }}>접수일</th>
              <th style={{ textAlign: 'left', padding: 8 }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{r.targetType} / {r.targetId.slice(0, 8)}...</td>
                <td style={{ padding: 8 }}>{r.reason ?? '-'}</td>
                <td style={{ padding: 8 }}>{r.reporter?.nickname ?? '-'}</td>
                <td style={{ padding: 8 }}>{r.status}</td>
                <td style={{ padding: 8 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: 8 }}>
                  <button type="button" onClick={() => openEdit(r)}>처리</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => !saving && setEditReport(null)}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 360,
              maxWidth: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>신고 처리</h2>
            <p style={{ marginBottom: 12, color: '#666' }}>
              대상: {editReport.targetType} / {editReport.targetId.slice(0, 8)}... · 사유: {editReport.reason ?? '-'}
            </p>
            {error && <p style={{ color: '#c00', marginBottom: 12 }}>{error}</p>}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>상태</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                style={{ width: '100%', padding: 8 }}
              >
                {REPORT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>관리자 메모</label>
              <textarea
                value={editAdminNote}
                onChange={(e) => setEditAdminNote(e.target.value)}
                style={{ width: '100%', padding: 8, minHeight: 80 }}
                placeholder="처리 내역 메모"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setEditReport(null)} disabled={saving}>취소</button>
              <button type="button" onClick={saveEdit} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
