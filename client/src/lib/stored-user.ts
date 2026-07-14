import type { AuthUser } from '../features/auth/types'

export type StoredUser = AuthUser

export const LAST_ACTIVITY_KEY = 'lastActivityAt'
export const SESSION_MESSAGE_KEY = 'sessionMessage'
export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function clearAuthStorage(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem(LAST_ACTIVITY_KEY)
}

export function invalidateSession(message: string): void {
  clearAuthStorage()
  sessionStorage.setItem(SESSION_MESSAGE_KEY, message)
  window.dispatchEvent(new Event('session-invalid'))
}

export function markSessionActivity(at = Date.now()): void {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(at))
}

export function isSessionExpired(now = Date.now()): boolean {
  const token = localStorage.getItem('token')
  if (!token) return false

  const raw = localStorage.getItem(LAST_ACTIVITY_KEY)
  if (!raw) {
    markSessionActivity(now)
    return false
  }

  const lastActivity = Number(raw)
  if (Number.isNaN(lastActivity)) {
    markSessionActivity(now)
    return false
  }

  return now - lastActivity >= INACTIVITY_TIMEOUT_MS
}
