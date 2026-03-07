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

  if (error) return <div style={{ color: '#c00' }}>{error}</div>
  if (!stats) return <div>로딩 중...</div>

  return (
    <div>
      <h1>대시보드</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginTop: 24 }}>
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
      style={{
        padding: 20,
        background: highlight ? '#fff3cd' : '#fff',
        border: '1px solid #eee',
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: '0.9rem', color: '#666' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: 4 }}>{value.toLocaleString()}</div>
    </div>
  )
}
