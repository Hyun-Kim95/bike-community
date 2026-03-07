import { useEffect, useState } from 'react'
import { api } from '../api/client'

interface User {
  id: string
  email: string
  nickname: string
  status: string
  createdAt: string
  profile?: { totalPoints: number; gradeName: string }
}

export function Users() {
  const [items, setItems] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search.trim()) params.set('search', search.trim())
    api<{ items: User[]; total: number }>(`/admin/users?${params}`)
      .then((res) => {
        setItems(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }, [page, search])

  return (
    <div>
      <h1>회원 관리</h1>
      <input
        type="search"
        placeholder="이메일/닉네임 검색"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        style={{ marginBottom: 16, padding: 8, width: 240 }}
      />
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>이메일</th>
              <th style={{ textAlign: 'left', padding: 8 }}>닉네임</th>
              <th style={{ textAlign: 'left', padding: 8 }}>상태</th>
              <th style={{ textAlign: 'left', padding: 8 }}>등급</th>
              <th style={{ textAlign: 'left', padding: 8 }}>포인트</th>
              <th style={{ textAlign: 'left', padding: 8 }}>가입일</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{u.email}</td>
                <td style={{ padding: 8 }}>{u.nickname}</td>
                <td style={{ padding: 8 }}>{u.status}</td>
                <td style={{ padding: 8 }}>{u.profile?.gradeName ?? '-'}</td>
                <td style={{ padding: 8 }}>{u.profile?.totalPoints ?? 0}</td>
                <td style={{ padding: 8 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ marginTop: 16 }}>총 {total}명</p>
    </div>
  )
}
