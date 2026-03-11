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
  usersChurnByDay: { date: string; withdrawn: number; dormant: number }[]
  regionActiveUsers: { region: string; count: number }[]
  transactionsByDay: { date: string; count: number; totalAmount: number; averageAmount: number }[]
  transactionsByWeek: { week: string; count: number; totalAmount: number; averageAmount: number }[]
  transactionsByMonth: { month: string; count: number; totalAmount: number; averageAmount: number }[]
  transactionsByCategory: { category: string; count: number }[]
  avgDaysToSell: number
  avgDaysToSellByCategory: { category: string; days: number }[]
  postsByWeek: { week: string; count: number }[]
  postsByMonth: { month: string; count: number }[]
  reportsByTargetType: { targetType: string; count: number; ratio: number }[]
  reportsByReason: { reason: string; count: number; ratio: number }[]
}

export async function getDashboard(): Promise<DashboardStats> {
  return api<DashboardStats>('/admin/stats')
}
