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
      <h1>게시글 관리</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="카테고리 필터"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          style={{ padding: 8, width: 160 }}
        />
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>제목</th>
                <th style={{ textAlign: 'left', padding: 8 }}>작성자</th>
                <th style={{ textAlign: 'left', padding: 8 }}>카테고리</th>
                <th style={{ textAlign: 'left', padding: 8 }}>작성일</th>
                <th style={{ textAlign: 'left', padding: 8 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8, maxWidth: 280 }} title={p.title}>
                    {p.title.length > 40 ? `${p.title.slice(0, 40)}...` : p.title}
                  </td>
                  <td style={{ padding: 8 }}>{p.author?.nickname ?? '-'}</td>
                  <td style={{ padding: 8 }}>{p.category}</td>
                  <td style={{ padding: 8 }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: 8 }}>
                    <button type="button" onClick={() => deletePost(p)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 16 }}>
            총 {total}건
            {totalPages > 1 && (
              <>
                {' · '}
                <button type="button" onClick={() => setPage((x) => Math.max(1, x - 1))} disabled={page <= 1}>이전</button>
                {' '}{page} / {totalPages}{' '}
                <button type="button" onClick={() => setPage((x) => Math.min(totalPages, x + 1))} disabled={page >= totalPages}>다음</button>
              </>
            )}
          </p>
        </>
      )}
    </div>
  )
}
