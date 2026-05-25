import { useState } from 'react'

export default function PinPage({ onVerify, onSetPin, isSetup = false }) {
  const [digits, setDigits] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  const handleDigit = (d) => {
    if (isSetup) {
      if (step === 1) {
        const next = digits + d
        setDigits(next)
        if (next.length === 4) setStep(2)
      } else {
        const next = confirm + d
        setConfirm(next)
        if (next.length === 4) {
          if (digits === next) {
            onSetPin(next)
          } else {
            setError('PIN이 일치하지 않습니다.')
            setDigits('')
            setConfirm('')
            setStep(1)
          }
        }
      }
    } else {
      const next = digits + d
      setDigits(next)
      if (next.length === 4) {
        if (!onVerify(next)) {
          setError('PIN이 올바르지 않습니다.')
          setDigits('')
        }
      }
    }
  }

  const handleDel = () => {
    if (step === 2) setConfirm(c => c.slice(0, -1))
    else setDigits(d => d.slice(0, -1))
  }

  const current = step === 2 ? confirm : digits

  return (
    <div className="pin-overlay">
      <div className="pin-card">
        <div className="pin-icon">🔐</div>
        <h2 className="pin-title">
          {isSetup
            ? step === 1 ? 'PIN 설정' : 'PIN 확인'
            : 'PIN 입력'}
        </h2>
        <p className="pin-sub">
          {isSetup
            ? step === 1 ? '4자리 PIN을 입력하세요' : '다시 한 번 입력하세요'
            : '4자리 PIN을 입력하세요'}
        </p>

        <div className="pin-dots">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pin-dot ${i < current.length ? 'filled' : ''}`} />
          ))}
        </div>

        {error && <p className="pin-error">{error}</p>}

        <div className="pin-keypad">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            <button
              key={i}
              className={`pin-key ${k === '' ? 'invisible' : ''}`}
              onClick={() => k === '⌫' ? handleDel() : k && handleDigit(k)}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
