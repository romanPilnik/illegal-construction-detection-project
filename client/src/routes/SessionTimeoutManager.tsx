import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  clearAuthStorage,
  isSessionExpired,
  markSessionActivity,
} from '../lib/stored-user'

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
]

function hasToken(): boolean {
  return Boolean(localStorage.getItem('token'))
}

export function SessionTimeoutManager() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const logoutIfExpired = () => {
      if (!hasToken()) return
      if (!isSessionExpired()) return

      clearAuthStorage()
      sessionStorage.setItem('idleLogoutPrompt', '1')
      navigate('/login', { replace: true, state: { from: location } })
    }

    const handleActivity = () => {
      if (!hasToken()) return
      markSessionActivity()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        logoutIfExpired()
      }
    }

    const handleInvalidSession = () => {
      navigate('/login', { replace: true, state: { from: location } })
    }

    logoutIfExpired()
    const intervalId = window.setInterval(logoutIfExpired, 60 * 1000)

    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, { passive: true }),
    )
    window.addEventListener('focus', logoutIfExpired)
    window.addEventListener('session-invalid', handleInvalidSession)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(intervalId)
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity),
      )
      window.removeEventListener('focus', logoutIfExpired)
      window.removeEventListener('session-invalid', handleInvalidSession)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [location, navigate])

  return null
}
