import { beforeEach, describe, expect, it, vi } from 'vitest'

const interceptorMocks = vi.hoisted(() => ({
  requestUse: vi.fn(),
  responseUse: vi.fn(),
  create: vi.fn(),
  invalidateSession: vi.fn(),
  requestHandler: undefined as unknown,
  successHandler: undefined as unknown,
  errorHandler: undefined as unknown,
}))

vi.mock('axios', () => ({
  default: {
    create: interceptorMocks.create,
  },
}))
vi.mock('../lib/stored-user', () => ({
  invalidateSession: interceptorMocks.invalidateSession,
}))

interceptorMocks.requestUse.mockImplementation((handler) => {
  interceptorMocks.requestHandler = handler
})
interceptorMocks.responseUse.mockImplementation((successHandler, errorHandler) => {
  interceptorMocks.successHandler = successHandler
  interceptorMocks.errorHandler = errorHandler
})
interceptorMocks.create.mockReturnValue({
  interceptors: {
    request: { use: interceptorMocks.requestUse },
    response: { use: interceptorMocks.responseUse },
  },
})

const { API_BASE_URL } = await import('./api')

type RequestHandler = (config: {
  headers: Record<string, string>
  method?: string
  url?: string
  metadata?: { startedAt: number }
}) => unknown

type ResponseHandler = (response: {
  status: number
  config: { method?: string; url?: string; metadata?: { startedAt: number } }
}) => unknown

type ErrorHandler = (error: {
  config?: { method?: string; url?: string; metadata?: { startedAt: number } }
  response?: { status: number; data?: { code?: string } }
  message?: string
}) => Promise<never>

describe('API client interceptors', () => {
  beforeEach(() => {
    interceptorMocks.invalidateSession.mockReset()
  })

  it('uses the configured default URL and attaches the current token', () => {
    expect(API_BASE_URL).toBe('http://localhost:5001/api/v1')
    localStorage.setItem('token', 'jwt-token')
    const requestHandler = interceptorMocks.requestHandler as RequestHandler
    const config = { headers: {}, method: 'get', url: '/analyses' }

    expect(requestHandler(config)).toBe(config)
    expect(config.headers).toEqual({ Authorization: 'Bearer jwt-token' })
    expect(config).toHaveProperty('metadata.startedAt')
  })

  it('returns successful responses unchanged', () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const successHandler = interceptorMocks.successHandler as ResponseHandler
    const response = {
      status: 200,
      config: { method: 'get', url: '/analyses', metadata: { startedAt: performance.now() } },
    }

    expect(successHandler(response)).toBe(response)
    expect(consoleInfo).toHaveBeenCalled()
  })

  it('invalidates inactive sessions and preserves the rejected error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    localStorage.setItem('token', 'jwt-token')
    const errorHandler = interceptorMocks.errorHandler as ErrorHandler
    const error = {
      config: { method: 'get', url: '/users' },
      response: { status: 401, data: { code: 'SESSION_INACTIVE' } },
    }

    await expect(errorHandler(error)).rejects.toBe(error)
    expect(interceptorMocks.invalidateSession).toHaveBeenCalledWith(
      'Your account is no longer active. Please contact an administrator.',
    )
    expect(consoleError).toHaveBeenCalled()
  })

  it('does not invalidate unrelated request failures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    localStorage.setItem('token', 'jwt-token')
    const errorHandler = interceptorMocks.errorHandler as ErrorHandler
    const error = { response: { status: 500, data: {} }, message: 'failed' }

    await expect(errorHandler(error)).rejects.toBe(error)
    expect(interceptorMocks.invalidateSession).not.toHaveBeenCalled()
  })
})
