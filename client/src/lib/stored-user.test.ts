import { describe, expect, it, vi } from 'vitest'
import {
  INACTIVITY_TIMEOUT_MS,
  LAST_ACTIVITY_KEY,
  SESSION_MESSAGE_KEY,
  clearAuthStorage,
  getStoredUser,
  invalidateSession,
  isSessionExpired,
  markSessionActivity,
} from './stored-user'

describe('stored user and session helpers', () => {
  it('reads a stored user and tolerates malformed JSON', () => {
    localStorage.setItem('user', JSON.stringify({ id: '1', username: 'Ada', role: 'Admin' }))
    expect(getStoredUser()).toEqual({ id: '1', username: 'Ada', role: 'Admin' })

    localStorage.setItem('user', '{')
    expect(getStoredUser()).toBeNull()
  })

  it('clears only authentication-related local storage', () => {
    localStorage.setItem('token', 'token')
    localStorage.setItem('user', '{}')
    localStorage.setItem(LAST_ACTIVITY_KEY, '10')
    localStorage.setItem('unrelated', 'keep')

    clearAuthStorage()

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem(LAST_ACTIVITY_KEY)).toBeNull()
    expect(localStorage.getItem('unrelated')).toBe('keep')
  })

  it('invalidates a session, stores its message, and announces the change', () => {
    localStorage.setItem('token', 'token')
    const listener = vi.fn()
    window.addEventListener('session-invalid', listener)

    invalidateSession('Sign in again')

    expect(localStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem(SESSION_MESSAGE_KEY)).toBe('Sign in again')
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('session-invalid', listener)
  })

  it('initializes missing and invalid activity timestamps without expiring', () => {
    localStorage.setItem('token', 'token')

    expect(isSessionExpired(1_000)).toBe(false)
    expect(localStorage.getItem(LAST_ACTIVITY_KEY)).toBe('1000')

    localStorage.setItem(LAST_ACTIVITY_KEY, 'invalid')
    expect(isSessionExpired(2_000)).toBe(false)
    expect(localStorage.getItem(LAST_ACTIVITY_KEY)).toBe('2000')
  })

  it('expires at the inactivity boundary and ignores sessions without a token', () => {
    markSessionActivity(5_000)
    expect(isSessionExpired(5_000 + INACTIVITY_TIMEOUT_MS)).toBe(false)

    localStorage.setItem('token', 'token')
    expect(isSessionExpired(5_000 + INACTIVITY_TIMEOUT_MS - 1)).toBe(false)
    expect(isSessionExpired(5_000 + INACTIVITY_TIMEOUT_MS)).toBe(true)
  })
})
