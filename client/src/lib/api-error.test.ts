import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from './api-error'

const axiosError = (data?: unknown, extra: Partial<AxiosError> = {}) =>
  new AxiosError(
    'request failed',
    extra.code,
    undefined,
    undefined,
    data === undefined
      ? undefined
      : {
          data,
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
  )

describe('getApiErrorMessage', () => {
  it('uses validation messages before general server messages', () => {
    const error = axiosError({
      message: 'general',
      errors: [{ message: 'Email is invalid' }, { field: 'password' }, {}],
    })

    expect(getApiErrorMessage(error, 'fallback')).toBe('Email is invalid; password')
  })

  it('supports message and error response payloads', () => {
    expect(getApiErrorMessage(axiosError({ message: 'Try again' }), 'fallback')).toBe('Try again')
    expect(getApiErrorMessage(axiosError({ error: 'Denied' }), 'fallback')).toBe('Denied')
  })

  it('distinguishes timeouts, network failures, and unknown errors', () => {
    expect(getApiErrorMessage(axiosError(undefined, { code: 'ECONNABORTED' }), 'fallback')).toBe(
      'The request timed out. Please try again.',
    )
    expect(getApiErrorMessage(axiosError(), 'fallback')).toBe(
      'Unable to reach the server. Check your connection and try again.',
    )
    expect(getApiErrorMessage(new Error('plain error'), 'fallback')).toBe('fallback')
  })

  it('falls back for an unrecognized HTTP response', () => {
    expect(getApiErrorMessage(axiosError({}), 'fallback')).toBe('fallback')
  })
})
