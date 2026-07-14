import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../services/api', () => ({ api: apiMock }))

import {
  createAnalysis,
  exportAnalysesByDate,
  exportAnalysisById,
  getAnalyses,
  getAnalysisById,
} from './analyses/api'
import { getAuditLogs } from './audit-logs/api'
import {
  changePassword,
  forgotPassword,
  login,
  register,
  resetPassword,
} from './auth/api'
import { getAnalysesMeta } from './dashboard/api'
import {
  createUser,
  deactivateUser,
  getUserById,
  getUsers,
  updateUser,
} from './users/api'

describe('feature API contracts', () => {
  beforeEach(() => {
    Object.values(apiMock).forEach((mock) => mock.mockReset())
    apiMock.get.mockResolvedValue({ data: { marker: 'get' } })
    apiMock.post.mockResolvedValue({ data: { marker: 'post' } })
    apiMock.put.mockResolvedValue({ data: { marker: 'put' } })
    apiMock.delete.mockResolvedValue({})
  })

  it('maps authentication calls to their server routes', async () => {
    await login({ email: 'a@example.com', password: 'secret' })
    await register({ username: 'Ada', email: 'a@example.com', password: 'secret' })
    await changePassword({ currentPassword: 'old', newPassword: 'new-password' })
    await forgotPassword({ email: 'a@example.com' })
    await resetPassword({ token: 'reset-token', newPassword: 'new-password' })

    expect(apiMock.post.mock.calls).toEqual([
      ['/auth/login', { email: 'a@example.com', password: 'secret' }],
      ['/auth/register', { username: 'Ada', email: 'a@example.com', password: 'secret' }],
      ['/auth/change-password', { currentPassword: 'old', newPassword: 'new-password' }],
      ['/auth/forgot-password', { email: 'a@example.com' }],
      ['/auth/reset-password', { token: 'reset-token', newPassword: 'new-password' }],
    ])
  })

  it('maps analysis list, detail, upload, and export parameters', async () => {
    await getAnalyses({ page: 2, limit: 25, status: 'Completed' })
    await getAnalysisById('analysis-1')
    const formData = new FormData()
    await createAnalysis(formData)
    await exportAnalysisById('analysis-1', 'PDF')
    await exportAnalysesByDate({ start_date: '2026-01-01', format: 'EXCEL' })

    expect(apiMock.get).toHaveBeenNthCalledWith(
      1,
      '/analyses',
      expect.objectContaining({
        params: expect.objectContaining({ page: 2, limit: 25, status: 'Completed' }),
      }),
    )
    expect(apiMock.get).toHaveBeenNthCalledWith(2, '/analyses/analysis-1')
    expect(apiMock.post).toHaveBeenNthCalledWith(
      1,
      '/analyses/analyse',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    expect(apiMock.post).toHaveBeenNthCalledWith(2, '/analyses/analysis-1/export', {
      format: 'PDF',
    })
    expect(apiMock.post).toHaveBeenNthCalledWith(
      3,
      '/analyses/export',
      expect.objectContaining({ start_date: '2026-01-01', format: 'EXCEL' }),
    )
  })

  it('normalizes audit, dashboard, and user queries', async () => {
    await getAuditLogs({ page: 2, action: '  LOGIN  ' })
    await getAnalysesMeta({ status: 'Pending' })
    await getUsers({
      page: 1,
      limit: 10,
      role: 'Admin',
      search: 'ada',
      isActiveFilter: '0',
    })

    expect(apiMock.get).toHaveBeenNthCalledWith(1, '/logs', {
      params: { page: 2, limit: 10, action: 'LOGIN' },
    })
    expect(apiMock.get).toHaveBeenNthCalledWith(2, '/analyses', {
      params: { page: 1, limit: 1, status: 'Pending' },
    })
    expect(apiMock.get).toHaveBeenNthCalledWith(3, '/users', {
      params: {
        page: 1,
        limit: 10,
        role: 'Admin',
        search: 'ada',
        isActiveFilter: '0',
      },
    })
  })

  it('maps user mutations and detail reads', async () => {
    const newUser = {
      username: 'Ada',
      email: 'ada@example.com',
      password: 'Password1',
      role: 'Inspector' as const,
    }
    await createUser(newUser)
    await getUserById('user-1')
    await updateUser('user-1', { username: 'Ada Updated' })
    await deactivateUser('user-1')

    expect(apiMock.post).toHaveBeenCalledWith('/users', newUser)
    expect(apiMock.get).toHaveBeenCalledWith('/users/user-1')
    expect(apiMock.put).toHaveBeenCalledWith('/users/user-1', {
      username: 'Ada Updated',
    })
    expect(apiMock.delete).toHaveBeenCalledWith('/users/user-1')
  })
})
