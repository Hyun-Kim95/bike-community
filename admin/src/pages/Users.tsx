import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

interface User {
  id: string
  email: string
  nickname: string
  status: string
  createdAt: string
  profile?: { totalPoints: number; gradeName: string }
}

interface PostItem {
  id: string
  title: string
  category: string
  createdAt: string
  author?: { id: string; nickname: string }
}

interface PointLogItem {
  id: string
  amount: number
  reason: string
  balanceAfter: number
  createdAt: string
}

const STATUS_OPTIONS = [
  { value: 'normal', label: '정상' },
  { value: 'suspended', label: '정지' },
  { value: 'withdrawn', label: '탈퇴' },
  { value: 'dormant', label: '휴면' },
] as const

function statusLabel(value: string): string {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value
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
const modalOverlay = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] overflow-y-auto py-8 px-4'
const modalPanel = 'bg-card text-card-foreground rounded-2xl shadow-2xl border border-border min-w-[320px] max-w-[880px] w-full max-h-[90vh] overflow-hidden flex flex-col'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export function Users() {
  const navigate = useNavigate()
  const [items, setItems] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [gradeOptions, setGradeOptions] = useState<string[]>([])
  const [joinedFrom, setJoinedFrom] = useState('')
  const [joinedTo, setJoinedTo] = useState('')
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [detailPosts, setDetailPosts] = useState<PostItem[]>([])
  const [detailPointLogs, setDetailPointLogs] = useState<PointLogItem[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [editStatus, setEditStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const limit = 10

  const fetchList = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search.trim()) params.set('search', search.trim())
    if (statusFilter) params.set('status', statusFilter)
    if (gradeFilter) params.set('gradeName', gradeFilter)
    if (joinedFrom) params.set('joinedFrom', joinedFrom)
    if (joinedTo) params.set('joinedTo', joinedTo)
    api<{ items: User[]; total: number }>(`/admin/users?${params}`)
      .then((res) => {
        setItems(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }, [page, search, statusFilter, gradeFilter, joinedFrom, joinedTo, limit])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    api<{ gradePolicy: { id: string; name: string }[] }>('/admin/grades')
      .then((res) => {
        setGradeOptions(res.gradePolicy.map((g) => g.name))
      })
      .catch(() => {
        setGradeOptions([])
      })
  }, [])

  const openDetail = useCallback((u: User) => {
    setDetailUser(u)
    setEditStatus(u.status || 'normal')
    setError('')
    setDetailPosts([])
    setDetailPointLogs([])
    setDetailLoading(true)
    const uid = u.id
    Promise.all([
      api<User>(`/admin/users/${uid}`).catch(() => null),
      api<{ items: PostItem[] }>(`/admin/posts?authorId=${uid}&limit=20`).then((r) => r.items || []).catch(() => []),
      api<{ items: PointLogItem[] }>(`/admin/points/history?userId=${uid}&limit=20`).then((r) => r.items || []).catch(() => []),
    ]).then(([user, posts, logs]) => {
      if (user && !(user as { error?: string }).error) {
        setDetailUser(user as User)
        setEditStatus((user as User).status || 'normal')
      }
      setDetailPosts(posts || [])
      setDetailPointLogs(logs || [])
    }).finally(() => setDetailLoading(false))
  }, [])

  const saveDetail = async () => {
    if (!detailUser) return
    setSaving(true)
    setError('')
    try {
      const updated = await api<User>(`/admin/users/${detailUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: editStatus }),
      })
      if (updated && !(updated as { error?: string }).error) {
        setDetailUser(updated as User)
        fetchList()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const closeDetail = () => {
    if (!saving) setDetailUser(null)
  }

  const filterBar = 'rounded-xl border border-border bg-muted/10 p-4 mb-4'
  const filterLabel = 'text-xs font-medium text-muted-foreground mb-1.5 block'
  const filterInput = 'rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent'

  return (
    <div>
      <h1 className={pageTitle}>회원 관리</h1>
      <div className={`${filterBar} flex flex-wrap gap-5 items-end`}>
        <div className="min-w-[260px] flex-1">
          <label className={filterLabel}>이메일·닉네임</label>
          <input
            type="search"
            placeholder="회원 검색"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className={`${filterInput} w-full`}
          />
        </div>
        <div className="min-w-[200px]">
          <label className={filterLabel}>상태</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className={`${filterInput} w-full`}
          >
            <option value="">전체</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[220px]">
          <label className={filterLabel}>등급</label>
          <select
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setPage(1) }}
            className={`${filterInput} w-full`}
          >
            <option value="">전체</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[220px]">
          <label className={filterLabel}>가입일 From</label>
          <input
            type="date"
            value={joinedFrom}
            onChange={(e) => { setJoinedFrom(e.target.value); setPage(1) }}
            className={`${filterInput} w-full`}
          />
        </div>
        <div className="min-w-[220px]">
          <label className={filterLabel}>가입일 To</label>
          <input
            type="date"
            value={joinedTo}
            onChange={(e) => { setJoinedTo(e.target.value); setPage(1) }}
            className={`${filterInput} w-full`}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-muted-foreground">로딩 중...</div>
      ) : (
        <>
          <div className="admin-pagination-summary-top">총 {total}명</div>
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
                  <td className={td}>{statusLabel(u.status)}</td>
                  <td className={td}>{u.profile?.gradeName ?? '-'}</td>
                  <td className={td}>{u.profile?.totalPoints ?? 0}</td>
                  <td className={td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className={td}>
                    <button type="button" className={`${btnSecondary} text-sm`} onClick={() => openDetail(u)}>상세</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="admin-pagination">
            <div className="admin-pagination-nav">
              <button
                type="button"
                className="admin-pagination-button"
                onClick={() => setPage(1)}
                disabled={page <= 1}
              >
                «
              </button>
              <button
                type="button"
                className="admin-pagination-button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ‹
              </button>
              <span className="admin-pagination-page">
                {page} / {Math.max(1, Math.ceil(total / limit))}
              </span>
              <button
                type="button"
                className="admin-pagination-button"
                onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / limit)), p + 1))}
                disabled={page >= Math.max(1, Math.ceil(total / limit))}
              >
                ›
              </button>
              <button
                type="button"
                className="admin-pagination-button"
                onClick={() => setPage(Math.max(1, Math.ceil(total / limit)))}
                disabled={page >= Math.max(1, Math.ceil(total / limit))}
              >
                »
              </button>
            </div>
          </div>
        </>
      )}

      {detailUser && (
        <div className={modalOverlay} onClick={closeDetail}>
          <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
              <h2 className="text-xl font-semibold text-foreground m-0">회원 상세</h2>
              <button
                type="button"
                onClick={closeDetail}
                disabled={saving}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                aria-label="닫기"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted/20 p-5 mb-6">
                <div className="flex flex-wrap items-start gap-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary text-xl font-semibold shrink-0">
                    {detailUser.nickname?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-foreground mb-1">{detailUser.nickname}</p>
                    <p className="text-sm text-muted-foreground mb-4">{detailUser.email}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {detailUser.profile?.gradeName ?? '-'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {detailUser.profile?.totalPoints ?? 0} P
                      </span>
                      <span className="text-muted-foreground text-sm">가입 {formatDate(detailUser.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-3 shrink-0 min-w-[220px]">
                    <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">상태 변경</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className={`${inputBase} w-[100px] py-1.5 text-sm min-h-0`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={`${btnPrimary} py-1.5 px-4 text-sm whitespace-nowrap min-h-0`}
                      onClick={saveDetail}
                      disabled={saving}
                    >
                      {saving ? '저장 중' : '저장'}
                    </button>
                  </div>
                </div>
              </div>

              <section className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">작성한 글</h3>
                  <button
                    type="button"
                    className={`${btnSecondary} text-xs py-1 px-2 h-8`}
                    onClick={() => navigate(`/posts?authorId=${detailUser.id}`)}
                  >
                    전체보기
                  </button>
                </div>
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  {detailLoading ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">로딩 중...</div>
                  ) : detailPosts.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">작성한 글이 없습니다.</div>
                  ) : (
                    <table className={tableWrap}>
                      <thead className={tableHead}>
                        <tr>
                          <th className={th}>제목</th>
                          <th className={th}>카테고리</th>
                          <th className={th}>작성일</th>
                        </tr>
                      </thead>
                      <tbody className={tableBody}>
                        {detailPosts.map((p) => (
                          <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                            <td className={td}>{p.title.length > 40 ? `${p.title.slice(0, 40)}...` : p.title}</td>
                            <td className={td}>
                              <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">{p.category}</span>
                            </td>
                            <td className={`${td} text-muted-foreground text-sm`}>{formatDate(p.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              <section className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">포인트 로그</h3>
                  <button
                    type="button"
                    className={`${btnSecondary} text-xs py-1 px-2 h-8`}
                    onClick={() => navigate(`/points?userId=${detailUser.id}`)}
                  >
                    전체보기
                  </button>
                </div>
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  {detailLoading ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">로딩 중...</div>
                  ) : detailPointLogs.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">포인트 기록이 없습니다.</div>
                  ) : (
                    <table className={tableWrap}>
                      <thead className={tableHead}>
                        <tr>
                          <th className={th}>일시</th>
                          <th className={th}>변동</th>
                          <th className={th}>사유</th>
                          <th className={th}>잔액</th>
                        </tr>
                      </thead>
                      <tbody className={tableBody}>
                        {detailPointLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                            <td className={`${td} text-muted-foreground text-sm`}>{formatDate(log.createdAt)}</td>
                            <td className={td}>
                              <span className={log.amount >= 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-destructive font-medium'}>
                                {log.amount >= 0 ? '+' : ''}{log.amount} P
                              </span>
                            </td>
                            <td className={td}>{log.reason}</td>
                            <td className={td}>{log.balanceAfter.toLocaleString()} P</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/20 shrink-0 flex justify-end">
              <button type="button" className={btnSecondary} onClick={closeDetail} disabled={saving}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
