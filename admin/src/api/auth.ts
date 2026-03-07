import { api, setToken } from './client'

export interface AdminLoginRes {
  accessToken: string
  admin: { id: string; email: string; name: string }
}

export async function login(email: string, password: string): Promise<AdminLoginRes> {
  const res = await api<AdminLoginRes>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(res.accessToken)
  return res
}
