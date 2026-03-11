import { api } from './client'

export interface ActivityLogItem {
  id: string
  adminId: string | null
  action: string
  targetType: string | null
  targetId: string | null
  meta: Record<string, unknown> | null
  createdAt: string
  admin?: {
    id: string
    email: string
    name: string
  } | null
}

export interface ActivityLogResponse {
  items: ActivityLogItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getActivityLogs(params: {
  page?: number
  limit?: number
  adminId?: string
  action?: string
  from?: string
  to?: string
  search?: string
}): Promise<ActivityLogResponse> {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.limit) sp.set('limit', String(params.limit))
  if (params.adminId) sp.set('adminId', params.adminId)
  if (params.action) sp.set('action', params.action)
  if (params.from) sp.set('from', params.from)
  if (params.to) sp.set('to', params.to)
  if (params.search) sp.set('search', params.search)
  const query = sp.toString()
  return api<ActivityLogResponse>(`/admin/activity-logs${query ? `?${query}` : ''}`)
}

