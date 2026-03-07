import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

interface Notice {
  id: string
  title: string
  content: string
  pinned: boolean
  createdAt: string
}

export function Notices() {
  const [items, setItems] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [modalNotice, setModalNotice] = useState<Notice | null>(null)
  const [isCreate, setIsCreate] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formPinned, setFormPinned] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchList = useCallback(() => {
    setLoading(true)
    api<{ items: Notice[] }>('/admin/notices?limit=50')
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false))
  }, [])

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
      <h1>공지사항</h1>
      <div style={{ marginBottom: 16 }}>
        <button type="button" onClick={openCreate}>공지 등록</button>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>제목</th>
              <th style={{ textAlign: 'left', padding: 8 }}>고정</th>
              <th style={{ textAlign: 'left', padding: 8 }}>등록일</th>
              <th style={{ textAlign: 'left', padding: 8 }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{n.title}</td>
                <td style={{ padding: 8 }}>{n.pinned ? 'Y' : ''}</td>
                <td style={{ padding: 8 }}>{new Date(n.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: 8 }}>
                  <button type="button" onClick={() => openEdit(n)} style={{ marginRight: 8 }}>수정</button>
                  <button type="button" onClick={() => deleteNotice(n)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
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
          onClick={closeModal}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 400,
              maxWidth: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>{isCreate ? '공지 등록' : '공지 수정'}</h2>
            {error && <p style={{ color: '#c00', marginBottom: 12 }}>{error}</p>}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>제목</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={{ width: '100%', padding: 8 }}
                placeholder="제목"
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>내용</label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                style={{ width: '100%', padding: 8, minHeight: 120 }}
                placeholder="내용"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>
                <input
                  type="checkbox"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                />
                {' '}상단 고정
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={closeModal} disabled={saving}>취소</button>
              <button type="button" onClick={saveNotice} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
