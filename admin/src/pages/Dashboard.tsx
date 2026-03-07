import { useEffect, useState } from 'react'
import { getDashboard, type DashboardStats } from '../api/stats'

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : '로딩 실패'))
  }, [])

  if (error) {
    return <div className="text-destructive">{error}</div>
  }
  if (!stats) {
    return <div className="text-muted-foreground">로딩 중...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">대시보드</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 mt-6">
        <StatCard label="전체 회원" value={stats.totalUsers} />
        <StatCard label="오늘 신규" value={stats.newUsersToday} />
        <StatCard label="게시글" value={stats.postsTotal} />
        <StatCard label="댓글" value={stats.commentsTotal} />
        <StatCard label="거래 상품" value={stats.itemsTotal} />
        <StatCard label="미처리 신고" value={stats.reportsPending} highlight={stats.reportsPending > 0} />
        <StatCard label="총 지급 포인트" value={stats.pointSum} />
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`p-5 rounded-lg border transition-colors ${
        highlight
          ? 'bg-secondary/30 border-secondary text-secondary-foreground'
          : 'bg-card text-card-foreground border-border'
      }`}
    >
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1 text-foreground">{value.toLocaleString()}</div>
    </div>
  )
}
