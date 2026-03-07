import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

interface Post {
  id: string
  title: string
  content: string
  category: string
  createdAt: string
  author?: { id: string; nickname: string }
}

const pageTitle = 'text-2xl font-semibold text-foreground mb-4'
const tableWrap = 'w-full border-collapse rounded-lg border border-border overflow-hidden'
const tableHead = 'border-b border-border bg-muted/50 text-left text-sm font-medium text-foreground'
const th = 'p-3'
const tableBody = 'bg-card text-card-foreground'
const td = 'p-3 border-b border-border'
const inputBase = 'w-full p-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
const btn = 'py-2 px-3 rounded-md font-medium cursor-pointer transition-opacity disabled:opacity-60 disabled:cursor-not-allowed'
const btnDestructive = 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-border ' + btn

export function Posts() {
  const [items, setItems] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')

  const fetchList = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (category.trim()) params.set('category', category.trim())
    api<{ items: Post[]; total: number }>(`/admin/posts?${params}`)
      .then((res) => {
        setItems(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }, [page, limit, category])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const deletePost = async (p: Post) => {
    if (!window.confirm(`"${p.title}" 게시글을 삭제하시겠습니까?`)) return
    try {
      await api(`/admin/posts/${p.id}`, { method: 'DELETE' })
      fetchList()
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div>
      <h1 className={pageTitle}>게시글 관리</h1>
      <div className="mb-4 flex gap-2 items-center">
        <input
          type="text"
          placeholder="카테고리 필터"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className={`${inputBase} w-40`}
        />
      </div>
      {loading ? (
        <div className="text-muted-foreground">로딩 중...</div>
      ) : (
        <>
          <table className={tableWrap}>
            <thead className={tableHead}>
              <tr>
                <th className={th}>제목</th>
                <th className={th}>작성자</th>
                <th className={th}>카테고리</th>
                <th className={th}>작성일</th>
                <th className={th}>관리</th>
              </tr>
            </thead>
            <tbody className={tableBody}>
              {items.map((p) => (
                <tr key={p.id}>
                  <td className={`${td} max-w-[280px]`} title={p.title}>
                    {p.title.length > 40 ? `${p.title.slice(0, 40)}...` : p.title}
                  </td>
                  <td className={td}>{p.author?.nickname ?? '-'}</td>
                  <td className={td}>{p.category}</td>
                  <td className={td}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className={td}>
                    <button type="button" className={`${btnDestructive} text-sm`} onClick={() => deletePost(p)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-muted-foreground">
            총 {total}건
            {totalPages > 1 && (
              <>
                {' · '}
                <button type="button" className={btn + ' text-primary'} onClick={() => setPage((x) => Math.max(1, x - 1))} disabled={page <= 1}>이전</button>
                {' '}{page} / {totalPages}{' '}
                <button type="button" className={btn + ' text-primary'} onClick={() => setPage((x) => Math.min(totalPages, x + 1))} disabled={page >= totalPages}>다음</button>
              </>
            )}
          </p>
        </>
      )}
    </div>
  )
}
