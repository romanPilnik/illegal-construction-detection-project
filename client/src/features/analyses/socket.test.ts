import { beforeEach, describe, expect, it, vi } from 'vitest'

const socketMocks = vi.hoisted(() => {
  const handlers = new Map<string, (...args: never[]) => void>()
  return {
    handlers,
    on: vi.fn((event: string, handler: (...args: never[]) => void) => {
      handlers.set(event, handler)
    }),
    off: vi.fn(),
    disconnect: vi.fn(),
    io: vi.fn(),
    invalidateSession: vi.fn(),
  }
})

vi.mock('socket.io-client', () => ({ io: socketMocks.io }))
vi.mock('../../lib/stored-user', () => ({
  invalidateSession: socketMocks.invalidateSession,
}))

import { subscribeToAnalysisUpdates } from './socket'

describe('subscribeToAnalysisUpdates', () => {
  beforeEach(() => {
    socketMocks.handlers.clear()
    socketMocks.io.mockReturnValue({
      on: socketMocks.on,
      off: socketMocks.off,
      disconnect: socketMocks.disconnect,
    })
  })

  it('does not connect without a token', () => {
    const cleanup = subscribeToAnalysisUpdates('analysis-1', vi.fn())
    expect(socketMocks.io).not.toHaveBeenCalled()
    expect(cleanup()).toBeUndefined()
  })

  it('refreshes on connection and on matching non-pending updates', () => {
    localStorage.setItem('token', 'token')
    const refresh = vi.fn()
    subscribeToAnalysisUpdates('analysis-1', refresh)

    expect(socketMocks.io).toHaveBeenCalledWith('http://localhost:5001', {
      auth: { token: 'token' },
    })

    socketMocks.handlers.get('connect')?.()
    socketMocks.handlers.get('analysis_updated')?.({
      analysisId: 'analysis-1',
      status: 'Completed',
    } as never)
    socketMocks.handlers.get('analysis_updated')?.({
      analysisId: 'analysis-1',
      status: 'Pending',
    } as never)
    socketMocks.handlers.get('analysis_updated')?.({
      analysisId: 'other',
      status: 'Failed',
    } as never)

    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('reports ordinary connection failures and invalidates rejected sessions', () => {
    localStorage.setItem('token', 'token')
    const connectionError = vi.fn()
    subscribeToAnalysisUpdates('analysis-1', vi.fn(), connectionError)

    socketMocks.handlers.get('connect_error')?.(new Error('offline') as never)
    expect(connectionError).toHaveBeenCalledWith(
      'Real-time updates are unavailable. Status will refresh automatically.',
    )

    socketMocks.handlers
      .get('connect_error')
      ?.(new Error('Invalid or inactive session') as never)
    expect(socketMocks.invalidateSession).toHaveBeenCalledWith(
      'Your session expired or became invalid. Please sign in again.',
    )
  })

  it('unregisters handlers and disconnects during cleanup', () => {
    localStorage.setItem('token', 'token')
    const refresh = vi.fn()
    const cleanup = subscribeToAnalysisUpdates('analysis-1', refresh)

    cleanup()

    expect(socketMocks.off).toHaveBeenCalledWith('analysis_updated', expect.any(Function))
    expect(socketMocks.off).toHaveBeenCalledWith('connect', refresh)
    expect(socketMocks.off).toHaveBeenCalledWith('connect_error')
    expect(socketMocks.disconnect).toHaveBeenCalledOnce()
  })
})
