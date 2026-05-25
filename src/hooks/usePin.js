import { useState, useEffect } from 'react'

export function usePin() {
  const [pinLocked, setPinLocked] = useState(false)
  const [pinSet, setPinSet] = useState(false)

  useEffect(() => {
    const storedPin = localStorage.getItem('app_pin')
    if (storedPin) {
      setPinSet(true)
      const lastUnlock = sessionStorage.getItem('pin_unlocked')
      if (!lastUnlock) setPinLocked(true)
    }
  }, [])

  const setPin = (pin) => {
    localStorage.setItem('app_pin', pin)
    setPinSet(true)
    sessionStorage.setItem('pin_unlocked', 'true')
  }

  const removePin = () => {
    localStorage.removeItem('app_pin')
    setPinSet(false)
    setPinLocked(false)
    sessionStorage.removeItem('pin_unlocked')
  }

  const verifyPin = (input) => {
    const stored = localStorage.getItem('app_pin')
    if (input === stored) {
      setPinLocked(false)
      sessionStorage.setItem('pin_unlocked', 'true')
      return true
    }
    return false
  }

  return { pinLocked, pinSet, setPin, removePin, verifyPin }
}
