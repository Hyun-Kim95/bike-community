import { api } from './client'

export interface DashboardStats {
  totalUsers: number
  newUsersToday: number
  postsTotal: number
  commentsTotal: number
  itemsTotal: number
  reportsPending: number
  pointSum: number
  usersByDay: { date: string; count: number }[]
  postsByDay: { date: string; count: number }[]
  pointsByDay: { date: string; amount: number }[]
}

export async function getDashboard(): Promise<DashboardStats> {
  return api<DashboardStats>('/admin/stats')
}
