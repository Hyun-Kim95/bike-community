import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'

interface User {
  id: string
  email: string
  nickname: string
  profile?: { totalPoints: number; gradeName: string }
}

interface PointHistoryItem {
  id: string
  userId: string
  amount: number
  reason: string
  balanceAfter: number
  createdAt: string
  user?: { id: string; email: string; nickname: string }
}

interface HistoryResponse {
  items: PointHistoryItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const pageTitle = 'text-2xl font-semibold text-foreground mb-4'
const card = 'rounded-lg border border-border bg-card text-card-foreground p-4 mb-4'
const tableWrap = 'w-full border-collapse rounded-lg border border-border overflow-hidden'
const tableHead = 'border-b border-border bg-muted/50 text-left text-sm font-medium text-foreground'
const th = 'p-3'
const tableBody = 'bg-card text-card-foreground'
const td = 'p-3 border-b border-border'
const inputBase = 'w-full p-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
const btn = 'py-2 px-3 rounded-md font-medium cursor-pointer transition-opacity disabled:opacity-60 disabled:cursor-not-allowed'
const btnPrimary = 'bg-primary text-primary-foreground hover:opacity-90 ' + btn
const btnSecondary = 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border ' + btn

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export function Points() {
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const [history, setHistory] = useState<PointHistoryItem[]>([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyLimit] = useState(10)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (!userSearch.trim()) {
      setSearchResults([])
      return
    }
    const t = setTimeout(() => {
      setSearchLoading(true)
      const params = new URLSearchParams({ search: userSearch.trim(), limit: '30' })
      api<{ items: User[] }>(`/admin/users?${params}`)
        .then((res) => {
          setSearchResults(res.items || [])
          setShowDropdown(true)
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [userSearch])

  const fetchHistory = useCallback(
    (overrides?: { page?: number; userId?: string }) => {
      setHistoryLoading(true)
      const page = overrides?.page ?? historyPage
      const uid = overrides?.userId
      const params = new URLSearchParams({ page: String(page), limit: String(historyLimit) })
      if (String(uid ?? '').trim()) params.set('userId', String(uid).trim())
      api<HistoryResponse>(`/admin/points/history?${params}`)
        .then((res) => {
          setHistory(res.items || [])
          setHistoryTotal(res.total ?? 0)
          if (overrides?.page !== undefined) setHistoryPage(overrides.page)
        })
        .catch(() => {
          setHistory([])
          setHistoryTotal(0)
        })
        .finally(() => setHistoryLoading(false))
    },
    [historyPage, historyLimit],
  )

  useEffect(() => {
    const uid = searchParams.get('userId') ?? ''
    if (uid) {
      fetchHistory({ page: 1, userId: uid })
    } else {
      fetchHistory()
    }
  }, [fetchHistory, searchParams])

  // 쿼리로 넘어온 userId가 있으면 회원 선택에도 자동 세팅
  useEffect(() => {
    const uid = searchParams.get('userId') ?? ''
    if (!uid) return
    api<User>(`/admin/users/${uid}`)
      .then((u) => {
        setSelectedUser(u)
      })
      .catch(() => {
        // ignore errors – 단순히 자동 선택만 시도
      })
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const uid = selectedUser?.id ?? ''
    const numAmount = Number(amount)
    const r = reason.trim().slice(0, 50)
    setSubmitError('')
    setSuccessMsg('')
    if (!uid) {
      setSubmitError('회원을 선택하세요.')
      return
    }
    if (Number.isNaN(numAmount) || numAmount === 0) {
      setSubmitError('0이 아닌 변동량을 입력하세요. (양수: 부여, 음수: 차감)')
      return
    }
    if (!r) {
      setSubmitError('사유를 입력하세요.')
      return
    }
    setSubmitting(true)
    try {
      const res = await api<{ balanceAfter: number }>('/admin/points', {
        method: 'POST',
        body: JSON.stringify({ userId: uid, amount: numAmount, reason: r }),
      })
      setSuccessMsg(
        numAmount > 0
          ? `포인트를 부여했습니다. 잔액: ${res.balanceAfter.toLocaleString()} P`
          : `포인트를 차감했습니다. 잔액: ${res.balanceAfter.toLocaleString()} P`,
      )
      setAmount('')
      setReason('')
      setSelectedUser(null)
      setUserSearch('')
      setShowDropdown(false)
      fetchHistory()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '처리 실패')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className={pageTitle}>포인트 관리</h1>
      <p className="text-muted-foreground mb-4">
        회원에게 포인트를 부여하거나 차감할 수 있으며, 변동 로그를 조회할 수 있습니다.
      </p>

      <div className={card}>
        <h2 className="text-lg font-medium mb-4">포인트 부여 / 차감</h2>
        {successMsg && (
          <p className="text-green-600 dark:text-green-400 mb-3 text-sm rounded-lg bg-green-500/10 px-3 py-2">{successMsg}</p>
        )}
        {submitError && (
          <p className="text-destructive mb-3 text-sm rounded-lg bg-destructive/10 px-3 py-2">{submitError}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="relative">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">회원 선택</label>
            {selectedUser ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted/30">
                <span className="flex-1">
                  {selectedUser.nickname || selectedUser.email} ({selectedUser.email}) · {selectedUser.profile?.totalPoints ?? 0} P
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null)
                    setUserSearch('')
                    setShowDropdown(false)
                    setHistoryPage(1)
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev)
                      next.delete('userId')
                      return next
                    })
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  변경
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="이메일 또는 닉네임 검색"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onFocus={() => userSearch.trim() && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-full"
                  autoComplete="off"
                />
                {showDropdown && (
                  <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                    {searchLoading ? (
                      <div className="p-3 text-sm text-muted-foreground">검색 중...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        {userSearch.trim() ? '검색 결과가 없습니다.' : '이메일 또는 닉네임을 입력하세요.'}
                      </div>
                    ) : (
                      searchResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className="w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                          onClick={() => {
                            setSelectedUser(u)
                            setUserSearch('')
                            setShowDropdown(false)
                            setHistoryPage(1)
                            setSearchParams((prev) => {
                              const next = new URLSearchParams(prev)
                              next.set('userId', u.id)
                              return next
                            })
                          }}
                        >
                          <span className="font-medium">{u.nickname || u.email}</span>
                          <span className="text-muted-foreground text-sm ml-2">({u.email})</span>
                          <span className="text-muted-foreground text-sm ml-2">· {u.profile?.totalPoints ?? 0} P</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">변동량 (양수: 부여, 음수: 차감)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-full"
              placeholder="예: 100 또는 -50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">사유 (최대 50자)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 50))}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-full"
              placeholder="예: 이벤트 보상"
              maxLength={50}
            />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className={btnPrimary} disabled={submitting}>
              {submitting ? '처리 중...' : '적용'}
            </button>
          </div>
        </form>
      </div>

      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">포인트 로그</h2>
        </div>
        {historyLoading ? (
          <p className="text-muted-foreground">로딩 중...</p>
        ) : (
          <>
            <div className="admin-pagination-summary-top">총 {historyTotal}건</div>
            <div className="overflow-x-auto">
              <table className={tableWrap}>
                <thead className={tableHead}>
                  <tr>
                    <th className={th}>일시</th>
                    <th className={th}>회원</th>
                    <th className={th}>변동</th>
                    <th className={th}>사유</th>
                    <th className={th}>잔액</th>
                  </tr>
                </thead>
                <tbody className={tableBody}>
                  {history.length === 0 ? (
                    <tr>
                      <td className={td} colSpan={5}>
                        기록이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    history.map((h) => (
                      <tr key={h.id}>
                        <td className={td}>{formatDate(h.createdAt)}</td>
                        <td className={td}>
                          {h.user
                            ? `${h.user.nickname || h.user.email} (${h.user.email})`
                            : '-'}
                        </td>
                        <td className={td}>
                          <span className={h.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}>
                            {h.amount >= 0 ? '+' : ''}{h.amount} P
                          </span>
                        </td>
                        <td className={td}>{h.reason}</td>
                        <td className={td}>{h.balanceAfter.toLocaleString()} P</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {historyTotal > 0 && (
              <div className="admin-pagination">
                <div className="admin-pagination-nav">
                  <button
                    type="button"
                    className="admin-pagination-button"
                    onClick={() => { setHistoryPage(1); fetchHistory({ page: 1 }) }}
                    disabled={historyPage <= 1}
                  >
                    «
                  </button>
                  <button
                    type="button"
                    className="admin-pagination-button"
                    onClick={() => {
                      const next = Math.max(1, historyPage - 1)
                      setHistoryPage(next)
                      fetchHistory({ page: next })
                    }}
                    disabled={historyPage <= 1}
                  >
                    ‹
                  </button>
                  <span className="admin-pagination-page">
                    {historyPage} / {Math.max(1, Math.ceil(historyTotal / historyLimit))}
                  </span>
                  <button
                    type="button"
                    className="admin-pagination-button"
                    onClick={() => {
                      const lastPage = Math.max(1, Math.ceil(historyTotal / historyLimit))
                      const next = Math.min(lastPage, historyPage + 1)
                      setHistoryPage(next)
                      fetchHistory({ page: next })
                    }}
                    disabled={historyPage >= Math.max(1, Math.ceil(historyTotal / historyLimit))}
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    className="admin-pagination-button"
                    onClick={() => {
                      const lastPage = Math.max(1, Math.ceil(historyTotal / historyLimit))
                      setHistoryPage(lastPage)
                      fetchHistory({ page: lastPage })
                    }}
                    disabled={historyPage >= Math.max(1, Math.ceil(historyTotal / historyLimit))}
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
