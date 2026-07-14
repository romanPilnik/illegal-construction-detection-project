import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAnalysesMeta: vi.fn(),
  getAnalyses: vi.fn(),
  getAnalysisById: vi.fn(),
  exportAnalysisById: vi.fn(),
  exportAnalysesByDate: vi.fn(),
  subscribeToAnalysisUpdates: vi.fn(),
  getAuditLogs: vi.fn(),
  getUsers: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deactivateUser: vi.fn(),
  changePassword: vi.fn(),
}))

vi.mock('./dashboard/api', () => ({ getAnalysesMeta: mocks.getAnalysesMeta }))
vi.mock('./analyses/api', () => ({
  getAnalyses: mocks.getAnalyses,
  getAnalysisById: mocks.getAnalysisById,
  exportAnalysisById: mocks.exportAnalysisById,
  exportAnalysesByDate: mocks.exportAnalysesByDate,
}))
vi.mock('./analyses/socket', () => ({
  subscribeToAnalysisUpdates: mocks.subscribeToAnalysisUpdates,
}))
vi.mock('./audit-logs/api', () => ({
  AUDIT_LOGS_PAGE_LIMIT: 10,
  getAuditLogs: mocks.getAuditLogs,
}))
vi.mock('./users/api', () => ({
  getUsers: mocks.getUsers,
  getUserById: mocks.getUserById,
  createUser: mocks.createUser,
  updateUser: mocks.updateUser,
  deactivateUser: mocks.deactivateUser,
}))
vi.mock('./auth/api', () => ({ changePassword: mocks.changePassword }))

import AnalysisDetail from './analyses/pages/AnalysisDetail'
import AnalysisHistory from './analyses/pages/AnalysisHistory'
import AuditLogs from './audit-logs/pages/AuditLogs'
import Dashboard from './dashboard/pages/Dashboard'
import Profile from './users/pages/Profile'
import UserManagement from './users/pages/UserManagement'

function renderAt(path: string, element: ReactElement, routePath = path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={element} />
        <Route path="*" element={<p>destination page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('feature page integrations', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset())
    mocks.subscribeToAnalysisUpdates.mockReturnValue(vi.fn())
  })

  it('loads dashboard totals and logs out', async () => {
    localStorage.setItem('token', 'token')
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'u1', username: 'Ada', email: 'ada@example.com', role: 'Admin' }),
    )
    mocks.getAnalysesMeta
      .mockResolvedValueOnce({ total: 12 })
      .mockResolvedValueOnce({ total: 3 })
    const user = userEvent.setup()
    renderAt('/', <Dashboard />)

    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Welcome, Ada')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Logout/i }))
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('loads analysis history and opens a row with the keyboard', async () => {
    mocks.getAnalyses.mockResolvedValue({
      data: [
        {
          id: 'analysis-123456789',
          request_title: 'Main Street',
          status: 'Completed',
          anomaly_detected: false,
          created_at: '2026-03-01T10:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1, hasNextPage: false },
    })
    const user = userEvent.setup()
    renderAt('/analyses', <AnalysisHistory />)

    const row = await screen.findByRole('button', { name: /Main Street/i })
    expect(screen.getByText('Normal')).toBeInTheDocument()
    row.focus()
    await user.keyboard('{Enter}')
    expect(row).not.toBeInTheDocument()
  })

  it('renders a completed analysis and subscribes for updates', async () => {
    mocks.getAnalysisById.mockResolvedValue({
      data: {
        id: 'analysis-1',
        request_title: 'Completed inspection',
        status: 'Completed',
        failure_reason: null,
        anomaly_detected: true,
        created_at: '2026-03-01T10:00:00.000Z',
        issued_by: { username: 'Ada' },
        before_image: { file_path: 'uploads/before.png' },
        after_image: { file_path: 'https://images.example/after.png' },
        result_image: null,
      },
    })
    renderAt('/analyses/analysis-1', <AnalysisDetail />, '/analyses/:analysisId')

    expect(await screen.findByText('Completed inspection')).toBeInTheDocument()
    expect(screen.getByText('Anomaly detected')).toBeInTheDocument()
    expect(screen.getByAltText('State Before')).toHaveAttribute(
      'src',
      'http://localhost:5001/uploads/before.png',
    )
    expect(mocks.subscribeToAnalysisUpdates).toHaveBeenCalledWith(
      'analysis-1',
      expect.any(Function),
      expect.any(Function),
    )
  })

  it('loads and filters audit logs after the debounce', async () => {
    mocks.getAuditLogs.mockResolvedValue({
      data: [
        {
          id: 'log-1',
          action: 'USER_LOGIN',
          ip_address: '127.0.0.1',
          timestamp: '2026-03-01T10:00:00.000Z',
          status: 'Success',
          details: null,
          user: { username: 'Ada' },
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false },
    })
    const user = userEvent.setup()
    renderAt('/logs', <AuditLogs />)

    expect(await screen.findByText('USER_LOGIN')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Filter by action'), 'login')
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    expect(mocks.getAuditLogs).toHaveBeenLastCalledWith({
      page: 1,
      limit: 10,
      action: 'login',
    })
  })

  it('uses stored inspector profile data and validates a new password', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u1',
        username: 'Inspector',
        email: 'inspector@example.com',
        role: 'Inspector',
      }),
    )
    const user = userEvent.setup()
    renderAt('/profile', <Profile />)

    expect(await screen.findAllByDisplayValue('Inspector')).toHaveLength(2)
    expect(mocks.getUserById).not.toHaveBeenCalled()
    await user.type(screen.getByLabelText('New Password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    expect(mocks.changePassword).not.toHaveBeenCalled()
  })

  it('loads the active user-management list', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'admin-1', username: 'Admin', role: 'Admin' }),
    )
    mocks.getUsers.mockResolvedValue({
      data: [
        {
          id: 'u2',
          username: 'Inspector Two',
          email: 'two@example.com',
          role: 'Inspector',
          is_active: true,
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false },
    })
    renderAt('/users', <UserManagement />)

    expect(await screen.findByText('Inspector Two')).toBeInTheDocument()
    expect(screen.getByText('two@example.com')).toBeInTheDocument()
    expect(mocks.getUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      isActiveFilter: '0',
    })
  })
})
