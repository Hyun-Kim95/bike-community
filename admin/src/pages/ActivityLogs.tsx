import { useEffect, useState } from 'react'
import { getActivityLogs, type ActivityLogItem } from '../api/activityLogs'

const pageTitle = 'text-2xl font-semibold text-foreground mb-4'

export function ActivityLogs() {
  const [items, setItems] = useState<ActivityLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getActivityLogs({ page, limit, action: action || undefined, search: search || undefined })
      .then((res) => {
        setItems(res.items)
        setTotal(res.total)
      })
      .catch((e) => setError(e instanceof Error ? e.message : '로딩 실패'))
      .finally(() => setLoading(false))
  }, [page, limit, action, search])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const formatAction = (value: string) => {
    const map: Record<string, string> = {
      'user.update': '회원 수정',
      'post.delete': '게시글 삭제',
      'comment.delete': '댓글 삭제',
      'report.update': '신고 처리',
      'notice.create': '공지 생성',
      'notice.update': '공지 수정',
      'notice.delete': '공지 삭제',
      'grade.create': '등급 생성',
      'grade.update': '등급 수정',
      'grade.delete': '등급 삭제',
      'points.change': '포인트 변경',
    }
    return map[value] ?? value
  }

  const formatTargetType = (value: string | null) => {
    if (!value) return '-'
    const map: Record<string, string> = {
      user: '회원',
      post: '게시글',
      comment: '댓글',
      report: '신고',
      notice: '공지',
      grade: '등급',
    }
    return map[value] ?? value
  }

  const formatUserStatus = (value: unknown) => {
    const map: Record<string, string> = {
      normal: '정상',
      suspended: '정지',
      withdrawn: '탈퇴',
      dormant: '휴면',
    }
    if (!value || typeof value !== 'string') return String(value ?? '')
    return map[value] ?? value
  }

  const formatReportStatus = (value: unknown) => {
    const map: Record<string, string> = {
      pending: '대기',
      under_review: '검토 중',
      resolved: '처리 완료',
      rejected: '기각',
    }
    if (!value || typeof value !== 'string') return String(value ?? '')
    return map[value] ?? value
  }

  const formatDetail = (log: ActivityLogItem) => {
    const meta = (log.meta || {}) as Record<string, unknown>
    switch (log.action) {
      case 'user.update': {
        const bits: string[] = []
        if (meta.status) bits.push(`상태: ${formatUserStatus(meta.status)}`)
        if (meta.gradeName) bits.push(`등급: ${meta.gradeName}`)
        if (meta.totalPoints !== undefined) bits.push(`포인트: ${meta.totalPoints}`)
        return bits.length ? bits.join(', ') : '회원 정보가 수정되었습니다.'
      }
      case 'post.delete':
        return `게시글 삭제: "${meta.title ?? ''}"`.trim()
      case 'comment.delete':
        return `댓글 삭제 (게시글 ID: ${meta.postId ?? '-'})`
      case 'report.update':
        return `신고 처리: 상태=${formatReportStatus(meta.status) || '-' }${
          meta.adminNote ? `, 메모="${meta.adminNote}"` : ''
        }`
      case 'notice.create':
        return `공지 생성: "${meta.title ?? ''}" (${meta.pinned ? '상단 고정' : '일반'})`
      case 'notice.update':
        return `공지 수정: "${meta.title ?? ''}" (${meta.pinned ? '상단 고정' : '일반'})`
      case 'notice.delete':
        return `공지 삭제: "${meta.title ?? ''}"`
      case 'grade.create':
        return `등급 생성: "${meta.name ?? ''}" (기준 포인트: ${meta.minPoints ?? 0})`
      case 'grade.update':
        return `등급 수정: "${meta.name ?? ''}" (기준 포인트: ${meta.minPoints ?? 0})`
      case 'grade.delete':
        return '등급 삭제'
      case 'points.change':
        return `포인트 ${Number(meta.amount ?? 0) >= 0 ? '지급' : '차감'}: ${meta.amount ?? 0} (사유: ${
          meta.reason ?? ''
        }, 변경 후 잔액: ${meta.balanceAfter ?? '-'}P)`
      default:
        if (!log.meta) return '-'
        return JSON.stringify(log.meta)
    }
  }

  return (
    <div>
      <h1 className={pageTitle}>활동 로그</h1>
      <div className="rounded-xl border border-border bg-muted/10 p-4 mb-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">액션</label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-w-[160px]"
          >
            <option value="">전체</option>
            <option value="user.update">회원 수정</option>
            <option value="post.delete">게시글 삭제</option>
            <option value="comment.delete">댓글 삭제</option>
            <option value="report.update">신고 처리</option>
            <option value="notice.create">공지 생성</option>
            <option value="notice.update">공지 수정</option>
            <option value="notice.delete">공지 삭제</option>
            <option value="grade.create">등급 생성</option>
            <option value="grade.update">등급 수정</option>
            <option value="grade.delete">등급 삭제</option>
            <option value="points.change">포인트 변경</option>
          </select>
        </div>
        <div className="flex-1 min-w-[220px] flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">검색(대상, ID, 메타)</label>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="키워드 검색"
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>
      {loading ? (
        <div className="text-muted-foreground">로딩 중...</div>
      ) : error ? (
        <div className="text-destructive text-sm">{error}</div>
      ) : (
        <>
          <div className="admin-pagination-summary-top">총 {total}건</div>
          <div className="w-full border-collapse rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border text-left text-xs font-medium text-foreground">
                <tr>
                  <th className="p-2">시각</th>
                  <th className="p-2">관리자</th>
                  <th className="p-2">액션</th>
                  <th className="p-2">대상</th>
                  <th className="p-2">상세</th>
                </tr>
              </thead>
              <tbody className="bg-card text-card-foreground">
                {items.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="p-2 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {log.admin
                        ? `${log.admin.name} (${log.admin.email})`
                        : log.adminId ?? '-'}
                    </td>
                    <td className="p-2 whitespace-nowrap">{formatAction(log.action)}</td>
                    <td className="p-2 whitespace-nowrap">
                      {formatTargetType(log.targetType)}
                      {log.targetId ? ` / ${log.targetId}` : ''}
                    </td>
                    <td className="p-2 max-w-[320px]">
                      <span className="text-xs text-foreground break-words">
                        {formatDetail(log)}
                      </span>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td className="p-3 text-center text-sm text-muted-foreground" colSpan={5}>
                      로그가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination mt-3">
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
                onClick={() => setPage((x) => Math.max(1, x - 1))}
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
                onClick={() => setPage((x) => Math.min(totalPages, x + 1))}
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

