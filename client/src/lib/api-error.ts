import { isAxiosError } from 'axios'

type ErrorPayload = {
  message?: string
  error?: string
  detail?: string
  errors?: Array<{ field?: string; message?: string }>
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback

  const payload = error.response?.data as ErrorPayload | undefined
  const validationMessages = payload?.errors
    ?.map((issue) => issue.message ?? issue.field)
    .filter((message): message is string => Boolean(message))

  if (validationMessages?.length) {
    return validationMessages.join('; ')
  }

  const main = payload?.message ?? payload?.error
  if (main && payload?.detail) {
    return `${main} (${payload.detail})`
  }
  if (main) return main

  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.'
  }
  if (!error.response) {
    return 'Unable to reach the server. Check your connection and try again.'
  }

  return fallback
}
