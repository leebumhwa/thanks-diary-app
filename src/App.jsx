import { useAuth } from './contexts/AuthContext'
import { usePin } from './hooks/usePin'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import PinPage from './pages/PinPage'

export default function App() {
  const { user, loading } = useAuth()
  const pinHook = usePin()

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-logo">📔</div>
        <p>감사 일기</p>
      </div>
    )
  }

  if (!user) return <AuthPage />

  if (pinHook.pinLocked) {
    return <PinPage onVerify={pinHook.verifyPin} />
  }

  return <HomePage pinHook={pinHook} />
}
