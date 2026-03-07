import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearToken } from '../api/client'

interface LayoutProps {
  children: ReactNode
}

const navLink = {
  display: 'block',
  padding: '8px 1rem',
  color: '#eee',
  textDecoration: 'none',
} as const

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 220,
          background: '#1a1a2e',
          color: '#eee',
          padding: '1rem 0',
        }}
      >
        <div style={{ padding: '0 1rem', fontWeight: 'bold', marginBottom: 16 }}>
          Bike Admin
        </div>
        <nav>
          <Link to="/" style={navLink}>대시보드</Link>
          <Link to="/users" style={navLink}>회원 관리</Link>
          <Link to="/reports" style={navLink}>신고 처리</Link>
          <Link to="/notices" style={navLink}>공지사항</Link>
        </nav>
        <button
          onClick={handleLogout}
          style={{
            margin: '16px 1rem 0',
            padding: '8px 12px',
            background: 'transparent',
            color: '#eee',
            border: '1px solid #555',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          로그아웃
        </button>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  )
}
