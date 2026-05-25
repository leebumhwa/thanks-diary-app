import { useState } from 'react'
import PinPage from '../pages/PinPage'

export default function PinSettings({ pinSet, setPin, removePin, onClose }) {
  const [mode, setMode] = useState(null)

  if (mode === 'setup') {
    return <PinPage isSetup onSetPin={(pin) => { setPin(pin); onClose() }} onCancel={onClose} />
  }

  if (mode === 'remove-verify') {
    return (
      <PinPage
        onVerify={(pin) => {
          const ok = localStorage.getItem('app_pin') === pin
          if (ok) { removePin(); onClose() }
          return ok
        }}
      />
    )
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card pin-settings">
        <div className="modal-header">
          <h2>PIN 설정</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <p className="pin-status">
          {pinSet ? '✅ PIN이 설정되어 있습니다.' : '❌ PIN이 설정되어 있지 않습니다.'}
        </p>
        <div className="pin-setting-actions">
          <button className="btn-save" onClick={() => setMode('setup')}>
            {pinSet ? 'PIN 변경' : 'PIN 설정'}
          </button>
          {pinSet && (
            <button className="btn-cancel" onClick={() => setMode('remove-verify')}>
              PIN 해제
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
