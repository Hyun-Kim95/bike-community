import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

interface User {
  id: string
  email: string
  nickname: string
  status: string
  createdAt: string
  profile?: { totalPoints: number; gradeName: string }
}

const STATUS_OPTIONS = ['normal', 'suspended', 'withdrawn', 'dormant'] as const

export function Users() {
  const [items, setItems] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editGradeName, setEditGradeName] = useState('')
  const [editTotalPoints, setEditTotalPoints] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchList = useCallback(() => {
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

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const openEdit = (u: User) => {
    setEditUser(u)
    setEditStatus(u.status)
    setEditGradeName(u.profile?.gradeName ?? '')
    setEditTotalPoints(u.profile?.totalPoints ?? 0)
    setError('')
  }

  const saveEdit = async () => {
    if (!editUser) return
    setSaving(true)
    setError('')
    try {
      await api(`/admin/users/${editUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: editStatus,
          gradeName: editGradeName || undefined,
          totalPoints: Number(editTotalPoints),
        }),
      })
      setEditUser(null)
      fetchList()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

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
              <th style={{ textAlign: 'left', padding: 8 }}>관리</th>
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
                <td style={{ padding: 8 }}>
                  <button type="button" onClick={() => openEdit(u)}>수정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ marginTop: 16 }}>총 {total}명</p>

      {editUser && (
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
          onClick={() => !saving && setEditUser(null)}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              maxWidth: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>회원 수정: {editUser.nickname}</h2>
            {error && <p style={{ color: '#c00', marginBottom: 12 }}>{error}</p>}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>상태</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                style={{ width: '100%', padding: 8 }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>등급명</label>
              <input
                type="text"
                value={editGradeName}
                onChange={(e) => setEditGradeName(e.target.value)}
                style={{ width: '100%', padding: 8 }}
                placeholder="예: 새싹 라이더"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>포인트</label>
              <input
                type="number"
                value={editTotalPoints}
                onChange={(e) => setEditTotalPoints(Number(e.target.value) || 0)}
                style={{ width: '100%', padding: 8 }}
                min={0}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setEditUser(null)} disabled={saving}>취소</button>
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
