import { isAxiosError } from 'axios'

type ErrorPayload = {
  message?: string
  error?: string
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
  if (payload?.message) return payload.message
  if (payload?.error) return payload.error

  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.'
  }
  if (!error.response) {
    return 'Unable to reach the server. Check your connection and try again.'
  }

  return fallback
}
