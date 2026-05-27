import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

export default function Header({ onPinSettings, currentTab, onTabChange }) {
  const { dark, toggle } = useTheme()
  const { user, signOut } = useAuth()

  return (
    <header className="app-header">
      <div className="header-left">
        <span className="header-logo">📔</span>
        <h1 className="header-title">하루노트</h1>
      </div>

      <nav className="header-tabs">
        <button
          className={`header-tab${currentTab === 'diary' ? ' active' : ''}`}
          onClick={() => onTabChange('diary')}
        >
          📔 일기
        </button>
        <button
          className={`header-tab${currentTab === 'todo' ? ' active' : ''}`}
          onClick={() => onTabChange('todo')}
        >
          ✅ 할 일
        </button>
      </nav>

      <div className="header-right">
        <button className="icon-btn" onClick={toggle} title={dark ? '라이트 모드' : '다크 모드'}>
          {dark ? '☀️' : '🌙'}
        </button>
        <button className="icon-btn" onClick={onPinSettings} title="PIN 설정">
          🔐
        </button>
        <button className="icon-btn" onClick={signOut} title="로그아웃">
          🚪
        </button>
        <span className="header-email">{user?.email}</span>
      </div>
    </header>
  )
}
