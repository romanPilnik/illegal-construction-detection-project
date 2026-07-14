import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LoginResponse } from '../types'

const loginMock = vi.hoisted(() => vi.fn())
vi.mock('../api', () => ({ login: loginMock }))

import Login from './Login'

function renderLogin(initialEntry: string | { pathname: string; state?: unknown } = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/private" element={<p>private page</p>} />
        <Route path="/" element={<p>home page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit() {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('Enter your email'), 'inspector@example.com')
  await user.type(screen.getByLabelText('Password'), 'Password123!')
  await user.click(screen.getByRole('button', { name: 'Sign In' }))
}

describe('Login', () => {
  beforeEach(() => loginMock.mockReset())

  it('stores the authenticated session and returns to the requested page', async () => {
    const response: LoginResponse = {
      message: 'ok',
      token: 'jwt-token',
      user: {
        id: 'user-1',
        username: 'Inspector',
        email: 'inspector@example.com',
        role: 'Inspector',
      },
    }
    loginMock.mockResolvedValue(response)
    renderLogin({ pathname: '/login', state: { from: { pathname: '/private' } } })

    await fillAndSubmit()

    expect(await screen.findByText('private page')).toBeInTheDocument()
    expect(loginMock).toHaveBeenCalledWith({
      email: 'inspector@example.com',
      password: 'Password123!',
    })
    expect(localStorage.getItem('token')).toBe('jwt-token')
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual(response.user)
    expect(Number(localStorage.getItem('lastActivityAt'))).toBeGreaterThan(0)
  })

  it('shows a response message when login returns no token', async () => {
    loginMock.mockResolvedValue({ message: 'Credentials rejected', token: '', user: null })
    renderLogin()

    await fillAndSubmit()

    expect(await screen.findByText('Credentials rejected')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('displays and dismisses an invalid-session message', async () => {
    sessionStorage.setItem('sessionMessage', 'Your account is inactive')
    const user = userEvent.setup()
    renderLogin()

    expect(screen.getByText('Your account is inactive')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Dismiss message' }))

    expect(screen.queryByText('Your account is inactive')).not.toBeInTheDocument()
    expect(sessionStorage.getItem('sessionMessage')).toBeNull()
  })
})
