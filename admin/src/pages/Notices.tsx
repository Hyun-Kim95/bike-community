import { useEffect, useState } from 'react'
import { api } from '../api/client'

interface Notice {
  id: string
  title: string
  content: string
  pinned: boolean
  createdAt: string
}

export function Notices() {
  const [items, setItems] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ items: Notice[] }>('/admin/notices?limit=50')
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1>공지사항</h1>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>제목</th>
              <th style={{ textAlign: 'left', padding: 8 }}>고정</th>
              <th style={{ textAlign: 'left', padding: 8 }}>등록일</th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{n.title}</td>
                <td style={{ padding: 8 }}>{n.pinned ? 'Y' : ''}</td>
                <td style={{ padding: 8 }}>{new Date(n.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
