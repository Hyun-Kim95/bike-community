import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

interface GradePolicyItem {
  id: string
  minPoints: number
  name: string
}

interface GradesResponse {
  gradePolicy: GradePolicyItem[]
  points: { ATTENDANCE: number; POST: number; COMMENT: number; REVIEW: number }
}

const POINT_LABELS: Record<string, string> = {
  ATTENDANCE: '출석',
  POST: '게시글 작성',
  COMMENT: '댓글 작성',
  REVIEW: '리뷰 작성',
}

const pageTitle = 'text-2xl font-semibold text-foreground mb-4'
const tableWrap = 'w-full border-collapse rounded-lg border border-border overflow-hidden max-w-2xl'
const tableHead = 'border-b border-border bg-muted/50 text-left text-sm font-medium text-foreground'
const th = 'p-3'
const tableBody = 'bg-card text-card-foreground'
const td = 'p-3 border-b border-border'
const card = 'rounded-lg border border-border bg-card text-card-foreground p-4 mb-4'
const inputBase = 'w-full p-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
const btn = 'py-2 px-3 rounded-md font-medium cursor-pointer transition-opacity disabled:opacity-60 disabled:cursor-not-allowed'
const btnPrimary = 'bg-primary text-primary-foreground hover:opacity-90 ' + btn
const btnSecondary = 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border ' + btn
const btnDestructive = 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-border ' + btn
const modalOverlay = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]'
const modalPanel = 'bg-card text-card-foreground p-6 rounded-lg shadow-lg border border-border min-w-[320px] max-w-[90%]'

export function Grades() {
  const [gradePolicy, setGradePolicy] = useState<GradePolicyItem[]>([])
  const [points, setPoints] = useState<GradesResponse['points'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState<'create' | GradePolicyItem | null>(null)
  const [formMinPoints, setFormMinPoints] = useState('0')
  const [formName, setFormName] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchGrades = useCallback(() => {
    setLoading(true)
    setError('')
    api<GradesResponse>('/admin/grades')
      .then((res) => {
        setGradePolicy(res.gradePolicy)
        setPoints(res.points)
      })
      .catch((e) => setError(e instanceof Error ? e.message : '조회 실패'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchGrades()
  }, [fetchGrades])

  const openCreate = () => {
    setModalOpen('create')
    setFormMinPoints('0')
    setFormName('')
    setFormError('')
  }

  const openEdit = (g: GradePolicyItem) => {
    setModalOpen(g)
    setFormMinPoints(String(g.minPoints))
    setFormName(g.name)
    setFormError('')
  }

  const closeModal = () => {
    if (!saving) setModalOpen(null)
  }

  const saveCreate = async () => {
    const minPoints = Number(formMinPoints)
    if (Number.isNaN(minPoints) || minPoints < 0) {
      setFormError('최소 포인트는 0 이상이어야 합니다.')
      return
    }
    if (!formName.trim()) {
      setFormError('등급명을 입력하세요.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await api('/admin/grades', {
        method: 'POST',
        body: JSON.stringify({ minPoints, name: formName.trim() }),
      })
      setModalOpen(null)
      fetchGrades()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '등록 실패')
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async () => {
    if (typeof modalOpen !== 'object' || !modalOpen) return
    const minPoints = Number(formMinPoints)
    if (Number.isNaN(minPoints) || minPoints < 0) {
      setFormError('최소 포인트는 0 이상이어야 합니다.')
      return
    }
    if (!formName.trim()) {
      setFormError('등급명을 입력하세요.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await api(`/admin/grades/${modalOpen.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ minPoints, name: formName.trim() }),
      })
      setModalOpen(null)
      fetchGrades()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '수정 실패')
    } finally {
      setSaving(false)
    }
  }

  const deleteGrade = async (g: GradePolicyItem) => {
    if (!window.confirm(`"${g.name}" 등급을 삭제하시겠습니까?`)) return
    try {
      await api(`/admin/grades/${g.id}`, { method: 'DELETE' })
      fetchGrades()
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className={pageTitle}>등급 관리</h1>
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (error && gradePolicy.length === 0) {
    return (
      <div>
        <h1 className={pageTitle}>등급 관리</h1>
        <p className="text-destructive">{error}</p>
        {error.includes('서버에 연결') && (
          <p className="mt-2 text-sm text-muted-foreground">
            백엔드(예: backend 폴더에서 npm run start:dev)가 실행 중인지 확인하세요. admin의 .env에 VITE_API_BASE_URL이 백엔드 주소(예: http://localhost:3000/api/v1)와 일치해야 합니다.
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <h1 className={pageTitle}>등급 관리</h1>
      <p className="text-muted-foreground mb-4">회원 포인트 구간에 따른 등급을 등록·수정할 수 있습니다.</p>
      {error && <p className="text-destructive mb-2 text-sm">{error}</p>}

      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">등급 구간</h2>
          <button type="button" className={btnPrimary} onClick={openCreate}>
            등급 추가
          </button>
        </div>
        <table className={tableWrap}>
          <thead className={tableHead}>
            <tr>
              <th className={th}>등급명</th>
              <th className={th}>최소 포인트</th>
              <th className={th}>관리</th>
            </tr>
          </thead>
          <tbody className={tableBody}>
            {gradePolicy.length === 0 ? (
              <tr>
                <td className={td} colSpan={3}>
                  등급이 없습니다. &quot;등급 추가&quot;로 등록하세요.
                </td>
              </tr>
            ) : (
              gradePolicy.map((g) => (
                <tr key={g.id}>
                  <td className={td}>{g.name}</td>
                  <td className={td}>{g.minPoints.toLocaleString()} P</td>
                  <td className={td}>
                    <button type="button" className={`${btnSecondary} text-sm mr-1`} onClick={() => openEdit(g)}>
                      수정
                    </button>
                    <button type="button" className={`${btnDestructive} text-sm`} onClick={() => deleteGrade(g)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {points && (
        <div className={card}>
          <h2 className="text-lg font-medium mb-3">포인트 지급 기준</h2>
          <ul className="space-y-2 text-foreground">
            {Object.entries(points).map(([key, value]) => (
              <li key={key}>
                <span className="font-medium">{POINT_LABELS[key] ?? key}</span>: {value} P
              </li>
            ))}
          </ul>
        </div>
      )}

      {modalOpen && (
        <div className={modalOverlay} onClick={closeModal}>
          <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mt-0 mb-4">
              {modalOpen === 'create' ? '등급 추가' : '등급 수정'}
            </h2>
            {formError && <p className="text-destructive mb-3 text-sm">{formError}</p>}
            <div className="mb-3">
              <label className="block mb-1 text-sm text-foreground">등급명</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={inputBase}
                placeholder="예: 새싹 라이더"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm text-foreground">최소 포인트</label>
              <input
                type="number"
                value={formMinPoints}
                onChange={(e) => setFormMinPoints(e.target.value)}
                className={inputBase}
                min={0}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className={btnSecondary} onClick={closeModal} disabled={saving}>
                취소
              </button>
              <button
                type="button"
                className={btnPrimary}
                onClick={modalOpen === 'create' ? saveCreate : saveEdit}
                disabled={saving}
              >
                {saving ? '저장 중...' : modalOpen === 'create' ? '등록' : '수정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
