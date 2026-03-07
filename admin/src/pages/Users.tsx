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
const modalPanel = 'bg-card text-card-foreground p-6 rounded-lg shadow-lg border border-border min-w-[320px] max-w-[90%]'

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
      <h1 className={pageTitle}>회원 관리</h1>
      <input
        type="search"
        placeholder="이메일/닉네임 검색"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        className={`${inputBase} mb-4 w-60`}
      />
      {loading ? (
        <div className="text-muted-foreground">로딩 중...</div>
      ) : (
        <table className={tableWrap}>
          <thead className={tableHead}>
            <tr>
              <th className={th}>이메일</th>
              <th className={th}>닉네임</th>
              <th className={th}>상태</th>
              <th className={th}>등급</th>
              <th className={th}>포인트</th>
              <th className={th}>가입일</th>
              <th className={th}>관리</th>
            </tr>
          </thead>
          <tbody className={tableBody}>
            {items.map((u) => (
              <tr key={u.id}>
                <td className={td}>{u.email}</td>
                <td className={td}>{u.nickname}</td>
                <td className={td}>{u.status}</td>
                <td className={td}>{u.profile?.gradeName ?? '-'}</td>
                <td className={td}>{u.profile?.totalPoints ?? 0}</td>
                <td className={td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className={td}>
                  <button type="button" className={`${btnSecondary} text-sm`} onClick={() => openEdit(u)}>수정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-4 text-muted-foreground">총 {total}명</p>

      {editUser && (
        <div className={modalOverlay} onClick={() => !saving && setEditUser(null)}>
          <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mt-0 mb-4">회원 수정: {editUser.nickname}</h2>
            {error && <p className="text-destructive mb-3 text-sm">{error}</p>}
            <div className="mb-3">
              <label className="block mb-1 text-sm text-foreground">상태</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputBase}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block mb-1 text-sm text-foreground">등급명</label>
              <input type="text" value={editGradeName} onChange={(e) => setEditGradeName(e.target.value)} className={inputBase} placeholder="예: 새싹 라이더" />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm text-foreground">포인트</label>
              <input type="number" value={editTotalPoints} onChange={(e) => setEditTotalPoints(Number(e.target.value) || 0)} className={inputBase} min={0} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className={btnSecondary} onClick={() => setEditUser(null)} disabled={saving}>취소</button>
              <button type="button" className={btnPrimary} onClick={saveEdit} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
