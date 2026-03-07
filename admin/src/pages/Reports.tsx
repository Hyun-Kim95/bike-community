import { useEffect, useState } from 'react'
import { api } from '../api/client'

interface Report {
  id: string
  targetType: string
  targetId: string
  reason: string | null
  status: string
  createdAt: string
  reporter?: { nickname: string }
}

export function Reports() {
  const [items, setItems] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: '1', limit: '30' })
    if (status) params.set('status', status)
    api<{ items: Report[] }>(`/admin/reports?${params}`)
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false))
  }, [status])

  return (
    <div>
      <h1>신고 처리</h1>
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginBottom: 16, padding: 8 }}>
        <option value="">전체</option>
        <option value="pending">접수</option>
        <option value="under_review">검토중</option>
        <option value="resolved">조치완료</option>
        <option value="rejected">반려</option>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
