const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'Failed to fetch' || msg.includes('fetch')) {
      throw new Error('서버에 연결할 수 없습니다. 백엔드가 실행 중인지, 주소가 맞는지 확인하세요.')
    }
    throw e
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    throw new Error(data.message || (res.status === 401 ? '로그인이 필요합니다.' : `HTTP ${res.status}`))
  }
  return data as T
}

export function setToken(token: string) {
  localStorage.setItem('admin_token', token)
}

export function clearToken() {
  localStorage.removeItem('admin_token')
}

export function isAuthenticated() {
  return !!getToken()
}
