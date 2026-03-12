import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getDashboard, type DashboardStats } from '../api/stats'

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')
  const [txTab, setTxTab] = useState<'day' | 'week' | 'month'>('day')

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

  const formatIsoWeekLabel = (isoWeek: string) => {
    const [yearStr, weekStr] = isoWeek.split('-')
    const year = Number.parseInt(yearStr, 10)
    const week = Number.parseInt(weekStr, 10)
    if (!Number.isFinite(year) || !Number.isFinite(week)) return isoWeek

    // ISO 주차 → 해당 주의 월/주차를 한국 시간 기준으로 계산
    // 1) 해당 ISO 주의 월요일(UTC 기준)을 구한다.
    const jan4 = new Date(Date.UTC(year, 0, 4))
    const jan4Day = jan4.getUTCDay() || 7 // 일요일을 7로
    const week1Monday = new Date(jan4)
    week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1)

    const mondayUtc = new Date(week1Monday)
    mondayUtc.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7)

    // 2) 한국 시간(KST, UTC+9)으로 변환
    const KST_OFFSET_MS = 9 * 60 * 60 * 1000
    const mondayKst = new Date(mondayUtc.getTime() + KST_OFFSET_MS)

    // 3) 주의 마지막 날(일요일)을 기준으로 월을 결정
    //    → 대부분의 날짜가 포함된 "끝나는 달" 기준으로 표시
    const sundayKst = new Date(mondayKst)
    sundayKst.setDate(mondayKst.getDate() + 6)

    const month = sundayKst.getMonth() + 1

    // 4) 해당 월에서 몇 주차인지 계산 (월요일 시작 주차)
    const firstOfMonth = new Date(sundayKst.getFullYear(), sundayKst.getMonth(), 1)
    const firstDay = (firstOfMonth.getDay() + 6) % 7 // 월요일=0
    const dayOfMonth = sundayKst.getDate()
    const weekOfMonth = Math.floor((firstDay + dayOfMonth - 1) / 7) + 1

    return `${month.toString().padStart(2, '0')}월 ${weekOfMonth}주차`
  }

  const txSource =
    txTab === 'day'
      ? stats.transactionsByDay.map((d) => ({
          label: d.date.slice(5),
          count: d.count,
          total: d.totalAmount,
          avg: d.averageAmount,
        }))
      : txTab === 'week'
        ? stats.transactionsByWeek.map((d) => ({
            label: formatIsoWeekLabel(d.week),
            count: d.count,
            total: d.totalAmount,
            avg: d.averageAmount,
          }))
        : stats.transactionsByMonth.map((d) => ({
            label: d.month,
            count: d.count,
            total: d.totalAmount,
            avg: d.averageAmount,
          }))

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
        <StatCard label="평균 판매 소요 일수" value={stats.avgDaysToSell} />
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
            color="#3b82f6"
          />
        </ChartCard>
        <ChartCard title="최근 7일 지급 포인트">
          <MiniBarChart
            data={stats.pointsByDay.map((d) => ({ label: d.date.slice(5), value: d.amount }))}
            max={maxPoints}
            color="#10b981"
          />
        </ChartCard>
        <ChartCard title="최근 7일 탈퇴·휴면 전환 수">
          <MiniBarChart
            data={stats.usersChurnByDay.map((d) => ({
              label: d.date.slice(5),
              value: d.withdrawn + d.dormant,
            }))}
            max={Math.max(
              ...stats.usersChurnByDay.map((d) => d.withdrawn + d.dormant),
              1,
            )}
            color="#ef4444"
          />
        </ChartCard>
        <ChartCard title="지역별 활성 사용자 수">
          {stats.regionActiveUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {stats.regionActiveUsers.map((r) => (
                <div key={r.region} className="flex items-center gap-2">
                  <div className="w-24 text-xs text-muted-foreground truncate">{r.region}</div>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2"
                      style={{
                        width: `${
                          (r.count /
                            Math.max(...stats.regionActiveUsers.map((x) => x.count), 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="w-10 text-xs text-right text-muted-foreground">{r.count}</div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
        <ChartCard title="거래 건수 (일/주/월)">
          <div className="flex gap-2 mb-2 text-xs">
            {(['day', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTxTab(t)}
                className={`px-2 py-1 rounded ${
                  txTab === t
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {t === 'day' ? '일별' : t === 'week' ? '주별' : '월별'}
              </button>
            ))}
          </div>
          <MiniBarChart
            data={txSource.map((d) => ({ label: d.label, value: d.count }))}
            max={Math.max(...txSource.map((d) => d.count), 1)}
          />
        </ChartCard>
        <ChartCard title="거래 총 금액">
          <MiniBarChart
            data={txSource.map((d) => ({ label: d.label, value: d.total }))}
            max={Math.max(...txSource.map((d) => d.total), 1)}
            color="#10b981"
          />
        </ChartCard>
        <ChartCard title="평균 거래 금액">
          <MiniBarChart
            data={txSource.map((d) => ({ label: d.label, value: d.avg }))}
            max={Math.max(...txSource.map((d) => d.avg), 1)}
            color="#f59e0b"
          />
        </ChartCard>
        <ChartCard title="카테고리별 거래 건수">
          <MiniBarChart
            data={stats.transactionsByCategory.map((c) => ({
              label: c.category,
              value: c.count,
            }))}
            max={Math.max(...stats.transactionsByCategory.map((c) => c.count), 1)}
            color="#6366f1"
          />
        </ChartCard>
        <ChartCard title="카테고리별 평균 판매 일수">
          <MiniBarChart
            data={stats.avgDaysToSellByCategory.map((c) => ({
              label: c.category,
              value: c.days,
            }))}
            max={Math.max(...stats.avgDaysToSellByCategory.map((c) => c.days), 1)}
            color="#f59e0b"
          />
        </ChartCard>
        <ChartCard title="게시글 수 (주별)">
          <MiniBarChart
            data={stats.postsByWeek.map((d) => ({
              label: formatIsoWeekLabel(d.week),
              value: d.count,
            }))}
            max={Math.max(...stats.postsByWeek.map((d) => d.count), 1)}
            color="#3b82f6"
          />
        </ChartCard>
        <ChartCard title="게시글 수 (월별)">
          <MiniBarChart
            data={stats.postsByMonth.map((d) => ({
              label: d.month,
              value: d.count,
            }))}
            max={Math.max(...stats.postsByMonth.map((d) => d.count), 1)}
            color="#3b82f6"
          />
        </ChartCard>
        <ChartCard title="신고 비율 (대상 종류별)">
          <MiniBarChart
            data={stats.reportsByTargetType.map((r) => {
              const labelMap: Record<string, string> = {
                post: '게시글',
                comment: '댓글',
                chat: '채팅',
                user: '사용자',
                review: '후기',
              }
              return {
                label: labelMap[r.targetType] ?? r.targetType,
                value: r.ratio,
              }
            })}
            max={100}
            color="#f97316"
          />
        </ChartCard>
        <ChartCard title="신고 비율 (원인별)">
          <MiniBarChart
            data={stats.reportsByReason.map((r) => ({
              label: r.reason,
              value: r.ratio,
            }))}
            max={100}
            color="#f97316"
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
  // max는 기존 시그니처 유지를 위해 남겨둠 (Recharts에서는 사용하지 않음)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  max,
  color = 'hsl(var(--primary))',
}: {
  data: { label: string; value: number }[]
  max: number
  color?: string
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
  }
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
