import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  register: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}))

vi.mock('../api', () => authMocks)

import ForgotPassword from './ForgotPassword'
import Register from './Register'
import ResetPassword from './ResetPassword'

function renderAuth(path: string, element: ReactElement) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path.split('?')[0]} element={element} />
        <Route path="/login" element={<p>login destination</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('authentication flows', () => {
  beforeEach(() => Object.values(authMocks).forEach((mock) => mock.mockReset()))

  it('validates registration passwords before sending the request', async () => {
    const user = userEvent.setup()
    renderAuth('/register', <Register />)

    await user.type(screen.getByPlaceholderText('e.g. shirel_test'), 'Ada')
    await user.type(screen.getByPlaceholderText('admin@test.com'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    expect(authMocks.register).not.toHaveBeenCalled()
  })

  it('registers a valid user and redirects to login', async () => {
    authMocks.register.mockResolvedValue({ message: 'created', userId: 'user-1' })
    const user = userEvent.setup()
    renderAuth('/register', <Register />)

    await user.type(screen.getByPlaceholderText('e.g. shirel_test'), 'Ada')
    await user.type(screen.getByPlaceholderText('admin@test.com'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'Password1')
    await user.selectOptions(screen.getByRole('combobox'), 'Admin')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    expect(await screen.findByText('login destination')).toBeInTheDocument()
    expect(authMocks.register).toHaveBeenCalledWith({
      username: 'Ada',
      email: 'ada@example.com',
      password: 'Password1',
      role: 'Admin',
    })
  })

  it('requests reset instructions and disables repeated submission', async () => {
    authMocks.forgotPassword.mockResolvedValue({ message: 'Check your inbox' })
    const user = userEvent.setup()
    renderAuth('/forgot-password', <ForgotPassword />)

    await user.type(screen.getByPlaceholderText('Enter your email'), 'ada@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(await screen.findByText('Check your inbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeDisabled()
    expect(authMocks.forgotPassword).toHaveBeenCalledWith({ email: 'ada@example.com' })
  })

  it('rejects missing reset tokens and mismatched passwords', async () => {
    const { unmount } = renderAuth('/reset-password', <ResetPassword />)
    expect(screen.getByText('This reset link is invalid or missing a token.')).toBeInTheDocument()
    unmount()

    const user = userEvent.setup()
    renderAuth('/reset-password?token=valid-token', <ResetPassword />)
    await user.type(screen.getByLabelText('New password'), 'Password1')
    await user.type(screen.getByLabelText('Confirm password'), 'Password2')
    await user.click(screen.getByRole('button', { name: 'Reset password' }))

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(authMocks.resetPassword).not.toHaveBeenCalled()
  })
})
