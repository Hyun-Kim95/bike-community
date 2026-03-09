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

  const maxUsers = Math.max(...stats.usersByDay.map((d) => d.count), 1)
  const maxPosts = Math.max(...stats.postsByDay.map((d) => d.count), 1)
  const maxPoints = Math.max(...stats.pointsByDay.map((d) => d.amount), 1)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">통계</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 mt-6">
        <StatCard label="전체 회원" value={stats.totalUsers} />
        <StatCard label="오늘 신규" value={stats.newUsersToday} />
        <StatCard label="게시글" value={stats.postsTotal} />
        <StatCard label="댓글" value={stats.commentsTotal} />
        <StatCard label="거래 상품" value={stats.itemsTotal} />
        <StatCard label="미처리 신고" value={stats.reportsPending} highlight={stats.reportsPending > 0} />
        <StatCard label="총 지급 포인트" value={stats.pointSum} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartCard title="최근 7일 가입자 수">
          <MiniBarChart
            data={stats.usersByDay.map((d) => ({ label: d.date.slice(5), value: d.count }))}
            max={maxUsers}
          />
        </ChartCard>
        <ChartCard title="최근 7일 게시글 수">
          <MiniBarChart
            data={stats.postsByDay.map((d) => ({ label: d.date.slice(5), value: d.count }))}
            max={maxPosts}
            color="bg-blue-500"
          />
        </ChartCard>
        <ChartCard title="최근 7일 지급 포인트">
          <MiniBarChart
            data={stats.pointsByDay.map((d) => ({ label: d.date.slice(5), value: d.amount }))}
            max={maxPoints}
            color="bg-emerald-500"
          />
        </ChartCard>
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground p-4">
      <h2 className="text-sm font-semibold text-foreground mb-3">{title}</h2>
      {children}
    </div>
  )
}

function MiniBarChart({
  data,
  max,
  color = 'bg-primary',
}: {
  data: { label: string; value: number }[]
  max: number
  color?: string
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
  }
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d) => {
        const h = max > 0 ? Math.round((d.value / max) * 100) : 0
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs text-muted-foreground">{d.value.toLocaleString()}</div>
            <div className="w-3 rounded-t-md bg-muted overflow-hidden">
              <div
                className={`${color} w-full rounded-t-md transition-all`}
                style={{ height: `${Math.max(h, 6)}%` }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground">{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}
