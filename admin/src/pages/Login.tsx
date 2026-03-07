import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { isAuthenticated } from '../api/client'
import { useTheme } from '../contexts/ThemeContext'

export function Login() {
  const navigate = useNavigate()
  const { isDark, toggle } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) navigate('/', { replace: true })
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <button
        type="button"
        onClick={toggle}
        className="absolute top-4 right-4 p-2 rounded-md border border-border bg-card text-foreground hover:bg-accent transition-colors"
        title={isDark ? '라이트 모드' : '다크 모드'}
      >
        {isDark ? '☀️' : '🌙'}
      </button>
      <form
        onSubmit={handleSubmit}
        className="bg-card text-card-foreground p-8 rounded-lg shadow-md w-[320px] border border-border"
      >
        <h1 className="text-xl font-semibold m-0 mb-2 text-foreground">Bike Admin</h1>
        <p className="m-0 mb-6 text-muted-foreground text-sm">관리자 로그인</p>
        {error && (
          <div className="py-2 px-3 mb-4 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="block w-full py-2.5 px-3 mb-3 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="block w-full py-2.5 px-3 mb-4 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-primary text-primary-foreground border-0 rounded-md cursor-pointer text-base font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  )
}
