import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearToken } from '../api/client'
import { useTheme } from '../contexts/ThemeContext'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const { isDark, toggle } = useTheme()

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-[220px] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col py-4">
        <div className="px-4 font-bold mb-4 text-sidebar-primary">
          Bike Admin
        </div>
        <nav className="flex-1">
          <Link
            to="/"
            className="block py-2 px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            통계
          </Link>
          <Link
            to="/users"
            className="block py-2 px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            회원 관리
          </Link>
          <Link
            to="/reports"
            className="block py-2 px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            신고 처리
          </Link>
          <Link
            to="/posts"
            className="block py-2 px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            게시글 관리
          </Link>
          <Link
            to="/notices"
            className="block py-2 px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            공지사항
          </Link>
          <Link
            to="/grades"
            className="block py-2 px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            등급 관리
          </Link>
          <Link
            to="/points"
            className="block py-2 px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            포인트 관리
          </Link>
        </nav>
        <button
          type="button"
          onClick={toggle}
          className="mx-4 mt-2 py-2 px-3 rounded-md border border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer text-sm flex items-center justify-center gap-1.5"
          title={isDark ? '라이트 모드' : '다크 모드'}
        >
          {isDark ? '☀️ 라이트' : '🌙 다크'}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="mx-4 mt-2 py-2 px-3 rounded-md border border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer text-sm"
        >
          로그아웃
        </button>
      </aside>
      <main className="flex-1 p-6 bg-background text-foreground overflow-auto">
        {children}
      </main>
    </div>
  )
}
