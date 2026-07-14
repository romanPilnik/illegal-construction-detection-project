import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sessionMocks = vi.hoisted(() => ({
  clearAuthStorage: vi.fn(),
  isSessionExpired: vi.fn(),
  markSessionActivity: vi.fn(),
}))

vi.mock('../lib/stored-user', () => sessionMocks)

import { SessionTimeoutManager } from './SessionTimeoutManager'

function renderManager() {
  return render(
    <MemoryRouter initialEntries={['/private']}>
      <SessionTimeoutManager />
      <Routes>
        <Route path="/private" element={<p>private page</p>} />
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SessionTimeoutManager', () => {
  beforeEach(() => {
    Object.values(sessionMocks).forEach((mock) => mock.mockReset())
    sessionMocks.clearAuthStorage.mockImplementation(() => {
      localStorage.removeItem('token')
    })
  })

  it('clears and redirects an expired authenticated session', () => {
    localStorage.setItem('token', 'token')
    sessionMocks.isSessionExpired.mockReturnValue(true)

    renderManager()

    expect(sessionMocks.clearAuthStorage).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem('idleLogoutPrompt')).toBe('1')
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('records activity and reacts to invalid-session events', () => {
    localStorage.setItem('token', 'token')
    sessionMocks.isSessionExpired.mockReturnValue(false)
    renderManager()

    act(() => window.dispatchEvent(new MouseEvent('mousedown')))
    expect(sessionMocks.markSessionActivity).toHaveBeenCalledOnce()

    act(() => window.dispatchEvent(new Event('session-invalid')))
    expect(screen.getByText('login page')).toBeInTheDocument()
  })
})
