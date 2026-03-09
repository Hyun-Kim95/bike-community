import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'

interface Post {
  id: string
  title: string
  content: string
  category: string
  createdAt: string
  author?: { id: string; nickname: string }
}

interface Comment {
  id: string
  postId: string
  authorId: string
  content: string
  createdAt: string
  author?: { id: string; nickname: string } | null
}

interface User {
  id: string
  email: string
  nickname: string
}

const POST_CATEGORIES = [
  '로드',
  'MTB',
  'BMX',
  '미니벨로',
  '부품/용품',
  '정비/튜닝',
  '라이딩 후기',
  '자유게시판',
]

const pageTitle = 'text-2xl font-semibold text-foreground mb-4'
const tableWrap = 'w-full border-collapse rounded-lg border border-border overflow-hidden'
const tableHead = 'border-b border-border bg-muted/50 text-left text-sm font-medium text-foreground'
const th = 'p-3'
const tableBody = 'bg-card text-card-foreground'
const td = 'p-3 border-b border-border'
const inputBase = 'w-full p-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
const btn = 'py-2 px-3 rounded-md font-medium cursor-pointer transition-opacity disabled:opacity-60 disabled:cursor-not-allowed'
const btnSecondary = 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border ' + btn
const btnDestructive = 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-border ' + btn

export function Posts() {
  const [items, setItems] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [authorSearch, setAuthorSearch] = useState('')
  const [authorResults, setAuthorResults] = useState<User[]>([])
  const [authorLoading, setAuthorLoading] = useState(false)
  const [selectedAuthor, setSelectedAuthor] = useState<User | null>(null)
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false)
  const [searchParams] = useSearchParams()
  const [authorIdFilter, setAuthorIdFilter] = useState(() => searchParams.get('authorId') ?? '')
  const [contentModalPost, setContentModalPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)

  useEffect(() => {
    if (!authorIdFilter || selectedAuthor) return
    api<User>(`/admin/users/${authorIdFilter}`)
      .then((u) => {
        setSelectedAuthor({ id: u.id, email: u.email, nickname: u.nickname })
      })
      .catch(() => {})
  }, [authorIdFilter, selectedAuthor])

  useEffect(() => {
    if (!authorSearch.trim()) {
      setAuthorResults([])
      return
    }
    const t = setTimeout(() => {
      setAuthorLoading(true)
      const params = new URLSearchParams({ search: authorSearch.trim(), limit: '30' })
      api<{ items: User[] }>(`/admin/users?${params}`)
        .then((res) => {
          setAuthorResults(res.items || [])
          setShowAuthorDropdown(true)
        })
        .catch(() => setAuthorResults([]))
        .finally(() => setAuthorLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [authorSearch])

  const fetchList = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search.trim()) params.set('search', search.trim())
    if (category) params.set('category', category)
    if (authorIdFilter) params.set('authorId', authorIdFilter)
    api<{ items: Post[]; total: number }>(`/admin/posts?${params}`)
      .then((res) => {
        setItems(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }, [page, limit, search, category, authorIdFilter])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const deletePost = async (p: Post) => {
    if (!window.confirm(`"${p.title}" 게시글을 삭제하시겠습니까?`)) return
    try {
      await api(`/admin/posts/${p.id}`, { method: 'DELETE' })
      if (contentModalPost?.id === p.id) setContentModalPost(null)
      fetchList()
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  const loadComments = useCallback((postId: string) => {
    setCommentsLoading(true)
    setCommentsError(null)
    api<{ items: Comment[] }>(`/admin/posts/${postId}/comments`)
      .then((res) => setComments(res.items ?? []))
      .catch((e) => {
        setComments([])
        setCommentsError(e instanceof Error ? e.message : '댓글 로드 실패')
      })
      .finally(() => setCommentsLoading(false))
  }, [])

  const openContentModal = (p: Post) => {
    setContentModalPost(p)
    setComments([])
    setCommentsError(null)
    loadComments(p.id)
  }

  const deleteComment = async (postId: string, comment: Comment) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return
    try {
      await api(`/admin/posts/${postId}/comments/${comment.id}`, { method: 'DELETE' })
      setComments((prev) => prev.filter((c) => c.id !== comment.id))
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  const totalPages = Math.ceil(total / limit) || 1

  const filterBar = 'rounded-xl border border-border bg-muted/10 p-4 mb-4'
  const filterLabel = 'text-xs font-medium text-muted-foreground mb-1.5 block'
  const filterInput = 'rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent'

  return (
    <div>
      <h1 className={pageTitle}>게시글 관리</h1>
      <div className={`${filterBar} flex flex-wrap gap-5 items-end`}>
        <div>
          <label className={filterLabel}>카테고리</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className={`${filterInput} w-[140px]`}
          >
            <option value="">전체</option>
            {POST_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label className={filterLabel}>작성자</label>
          {selectedAuthor ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 min-w-[200px]">
              <span className="flex-1 text-sm truncate">
                {selectedAuthor.nickname || selectedAuthor.email}
              </span>
              <button
                type="button"
                onClick={() => { setSelectedAuthor(null); setAuthorSearch(''); setShowAuthorDropdown(false); setPage(1) }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                변경
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="이메일 또는 닉네임 검색"
                value={authorSearch}
                onChange={(e) => { setAuthorSearch(e.target.value); setPage(1) }}
                onFocus={() => authorSearch.trim() && setShowAuthorDropdown(true)}
                onBlur={() => setTimeout(() => setShowAuthorDropdown(false), 150)}
                className={`${filterInput} w-44`}
                autoComplete="off"
              />
              {showAuthorDropdown && (
                <div className="absolute z-10 mt-1 w-full max-w-[280px] max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                  {authorLoading ? (
                    <div className="p-3 text-sm text-muted-foreground">검색 중...</div>
                  ) : authorResults.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      {authorSearch.trim() ? '검색 결과가 없습니다.' : '이메일 또는 닉네임을 입력하세요.'}
                    </div>
                  ) : (
                    authorResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 text-sm"
                        onClick={() => {
                          setSelectedAuthor(u)
                          setAuthorIdFilter(u.id)
                          setAuthorSearch('')
                          setShowAuthorDropdown(false)
                          setPage(1)
                        }}
                      >
                        {u.nickname || u.email} ({u.email})
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex-1 min-w-[260px]">
          <label className={filterLabel}>제목·내용</label>
          <input
            type="search"
            placeholder="검색"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className={`${filterInput} w-full`}
          />
        </div>
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
                    <button type="button" className={`${btnSecondary} text-sm mr-2`} onClick={() => openContentModal(p)}>내용 보기</button>
                    <button type="button" className={`${btnDestructive} text-sm`} onClick={() => deletePost(p)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contentModalPost && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setContentModalPost(null)}>
              <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border border-border min-w-[360px] max-w-[90%] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-2">{contentModalPost.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {contentModalPost.author?.nickname} · {contentModalPost.category} · {new Date(contentModalPost.createdAt).toLocaleString()}
                </p>
                <div className="flex-1 overflow-y-auto rounded border border-border p-3 bg-muted/20 text-sm whitespace-pre-wrap mb-4">
                  {contentModalPost.content || '(내용 없음)'}
                </div>
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold mb-2">댓글 ({comments.length})</h4>
                  {commentsLoading ? (
                    <p className="text-sm text-muted-foreground">로딩 중...</p>
                  ) : commentsError ? (
                    <p className="text-sm text-destructive">{commentsError}</p>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">댓글이 없습니다.</p>
                  ) : (
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {comments.map((c) => (
                        <li key={c.id} className="flex justify-between gap-2 items-start rounded border border-border bg-background p-2 text-sm">
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-muted-foreground">{c.author?.nickname ?? '-'}</span>
                            <span className="text-muted-foreground ml-2 text-xs">{new Date(c.createdAt).toLocaleString()}</span>
                            <p className="mt-0.5 whitespace-pre-wrap break-words">{c.content}</p>
                          </div>
                          <button
                            type="button"
                            className={`${btnDestructive} text-xs shrink-0`}
                            onClick={() => deleteComment(contentModalPost.id, c)}
                          >
                            삭제
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <button type="button" className={btn + ' bg-muted text-muted-foreground hover:bg-accent'} onClick={() => setContentModalPost(null)}>닫기</button>
                </div>
              </div>
            </div>
          )}
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
