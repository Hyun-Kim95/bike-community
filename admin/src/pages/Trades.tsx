import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

interface MarketplaceItem {
  id: string
  title: string
  category: string
  price: number
  region: string
  saleStatus: string
  viewCount: number
  wishCount: number
  createdAt: string
  seller?: {
    id: string
    email: string
    nickname: string
  }
  tradePartner?: {
    id: string
    email: string
    nickname: string
  } | null
  statusChangedAt?: string | null
}

const TRADE_CATEGORIES = [
  '',
  '로드',
  'MTB',
  'BMX',
  '완성차',
  '프레임',
  '휠셋',
  '부품',
  '의류',
  '기타 용품',
] as const

const SALE_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'on_sale', label: '판매중' },
  { value: 'reserved', label: '예약중' },
  { value: 'sold', label: '판매완료' },
  { value: 'hidden', label: '숨김' },
] as const

const pageTitle = 'text-2xl font-semibold text-foreground mb-4'
const tableWrap = 'w-full border-collapse rounded-lg border border-border overflow-hidden'
const tableHead = 'border-b border-border bg-muted/50 text-left text-sm font-medium text-foreground'
const th = 'p-3'
const tableBody = 'bg-card text-card-foreground'
const td = 'p-3 border-b border-border'
const inputBase =
  'w-full p-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
const btn =
  'py-1.5 px-3 rounded-md font-medium cursor-pointer transition-opacity disabled:opacity-60 disabled:cursor-not-allowed'
const btnSecondary =
  'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border ' + btn

function formatStatus(value: string) {
  const opt = SALE_STATUS_OPTIONS.find((o) => o.value === value)
  return opt ? opt.label : value
}

export function Trades() {
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [seller, setSeller] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const limit = 10

  const fetchList = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.set('status', status)
    if (category.trim()) params.set('category', category.trim())
    if (seller.trim()) params.set('seller', seller.trim())
    api<{ items: MarketplaceItem[]; total: number }>(`/admin/marketplace-items?${params}`)
      .then((res) => {
        setItems(res.items || [])
        setTotal(res.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [page, limit, status, category, seller])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const changeStatus = async (item: MarketplaceItem, nextStatus: string) => {
    if (item.saleStatus === nextStatus) return
    setSavingId(item.id)
    try {
      await api(`/admin/marketplace-items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ saleStatus: nextStatus }),
      })
      fetchList()
    } catch {
      // ignore, 간단히 처리
    } finally {
      setSavingId(null)
    }
  }

  const filterBar = 'rounded-xl border border-border bg-muted/10 p-4 mb-4 flex flex-wrap gap-4 items-end'
  const filterLabel = 'text-xs font-medium text-muted-foreground mb-1.5 block'
  const filterInput =
    'rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent'

  return (
    <div>
      <h1 className={pageTitle}>거래 관리</h1>
      <div className={filterBar}>
        <div className="min-w-[180px]">
          <label className={filterLabel}>상태</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className={`${filterInput} w-full`}
          >
            {SALE_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px]">
          <label className={filterLabel}>카테고리</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
            className={filterInput}
          >
            {TRADE_CATEGORIES.map((c) => (
              <option key={c || 'all'} value={c}>
                {c || '전체'}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className={filterLabel}>판매자 이메일·닉네임</label>
          <input
            type="search"
            value={seller}
            onChange={(e) => {
              setSeller(e.target.value)
              setPage(1)
            }}
            placeholder="판매자 검색"
            className={filterInput}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">로딩 중...</div>
      ) : (
        <>
          <div className="admin-pagination-summary-top">총 {total}건</div>
          <table className={tableWrap}>
            <thead className={tableHead}>
              <tr>
                <th className={th}>제목</th>
                <th className={th}>판매자</th>
                <th className={th}>카테고리</th>
                <th className={th}>가격</th>
                <th className={th}>상태</th>
                <th className={th}>등록일</th>
                <th className={th}>조회/관심</th>
              </tr>
            </thead>
            <tbody className={tableBody}>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className={`${td} max-w-[260px]`} title={item.title}>
                    {item.title.length > 40 ? `${item.title.slice(0, 40)}...` : item.title}
                  </td>
                  <td className={td}>
                    {item.seller ? `${item.seller.nickname} (${item.seller.email})` : '-'}
                  </td>
                  <td className={td}>{item.category}</td>
                  <td className={td}>{Number(item.price).toLocaleString()}원</td>
                  <td className={td}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <select
                          value={item.saleStatus}
                          onChange={(e) => changeStatus(item, e.target.value)}
                          className={`${inputBase} w-[130px] py-1 text-sm`}
                          disabled={savingId === item.id}
                        >
                          {SALE_STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {(item.saleStatus === 'reserved' || item.saleStatus === 'sold') && (
                        <div className="text-[11px] text-muted-foreground">
                          <div>
                            상대:{' '}
                            {item.tradePartner
                              ? `${item.tradePartner.nickname} (${item.tradePartner.email})`
                              : '-'}
                          </div>
                          {item.statusChangedAt && (
                            <div>
                              변경일:{' '}
                              {new Date(item.statusChangedAt).toLocaleString('ko-KR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={td}>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className={td}>
                    <span className="text-xs text-muted-foreground">
                      조회 {item.viewCount} · 관심 {item.wishCount}
                    </span>
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
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className="admin-pagination-button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                ›
              </button>
              <button
                type="button"
                className="admin-pagination-button"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
              >
                »
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

