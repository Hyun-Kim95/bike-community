import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

interface Notice {
  id: string
  title: string
  content: string
  pinned: boolean
  createdAt: string
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
const btnDestructive = 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-border ' + btn
const modalOverlay = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]'
const modalPanel = 'bg-card text-card-foreground p-6 rounded-lg shadow-lg border border-border min-w-[400px] max-w-[90%] max-h-[90vh] overflow-auto'

export function Notices() {
  const [items, setItems] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [modalNotice, setModalNotice] = useState<Notice | null>(null)
  const [isCreate, setIsCreate] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formPinned, setFormPinned] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const limit = 10

  const fetchList = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    api<{ items: Notice[]; total: number; page: number; limit: number; totalPages: number }>(`/admin/notices?${params}`)
      .then((res) => {
        setItems(res.items)
        setTotal(res.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [page, limit])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const openCreate = () => {
    setIsCreate(true)
    setModalNotice(null)
    setFormTitle('')
    setFormContent('')
    setFormPinned(false)
    setError('')
  }

  const openEdit = (n: Notice) => {
    setIsCreate(false)
    setModalNotice(n)
    setFormTitle(n.title)
    setFormContent(n.content)
    setFormPinned(n.pinned)
    setError('')
  }

  const closeModal = () => {
    if (!saving) {
      setModalNotice(null)
      setIsCreate(false)
    }
  }

  const saveNotice = async () => {
    if (!formTitle.trim()) {
      setError('제목을 입력하세요.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isCreate) {
        await api('/admin/notices', {
          method: 'POST',
          body: JSON.stringify({ title: formTitle.trim(), content: formContent.trim(), pinned: formPinned }),
        })
      } else if (modalNotice) {
        await api(`/admin/notices/${modalNotice.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ title: formTitle.trim(), content: formContent.trim(), pinned: formPinned }),
        })
      }
      closeModal()
      fetchList()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const deleteNotice = async (n: Notice) => {
    if (!window.confirm(`"${n.title}" 공지를 삭제하시겠습니까?`)) return
    try {
      await api(`/admin/notices/${n.id}`, { method: 'DELETE' })
      fetchList()
      if (modalNotice?.id === n.id) closeModal()
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  const showModal = isCreate || modalNotice !== null

  return (
    <div>
      <h1 className={pageTitle}>공지사항</h1>
      <div className="mb-4 flex justify-end">
        <button type="button" className={btnPrimary} onClick={openCreate}>공지 등록</button>
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
                <th className={th}>고정</th>
                <th className={th}>등록일</th>
                <th className={th}>관리</th>
              </tr>
            </thead>
            <tbody className={tableBody}>
              {items.map((n) => (
                <tr key={n.id}>
                  <td className={td}>{n.title}</td>
                  <td className={td}>{n.pinned ? 'Y' : ''}</td>
                  <td className={td}>{new Date(n.createdAt).toLocaleDateString()}</td>
                  <td className={td}>
                    <button type="button" className={`${btnSecondary} text-sm mr-2`} onClick={() => openEdit(n)}>수정</button>
                    <button type="button" className={`${btnDestructive} text-sm`} onClick={() => deleteNotice(n)}>삭제</button>
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

      {showModal && (
        <div className={modalOverlay} onClick={closeModal}>
          <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mt-0 mb-4">{isCreate ? '공지 등록' : '공지 수정'}</h2>
            {error && <p className="text-destructive mb-3 text-sm">{error}</p>}
            <div className="mb-3">
              <label className="block mb-1 text-sm text-foreground">제목</label>
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className={inputBase} placeholder="제목" />
            </div>
            <div className="mb-3">
              <label className="block mb-1 text-sm text-foreground">내용</label>
              <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} className={`${inputBase} min-h-[120px]`} placeholder="내용" />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer text-foreground">
                <input type="checkbox" checked={formPinned} onChange={(e) => setFormPinned(e.target.checked)} className="rounded border-input" />
                상단 고정
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className={btnSecondary} onClick={closeModal} disabled={saving}>취소</button>
              <button type="button" className={btnPrimary} onClick={saveNotice} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
