import { io } from 'socket.io-client'
import { API_BASE_URL } from '../../services/api'
import { invalidateSession } from '../../lib/stored-user'
import type { AnalysisStatus } from './types'

type AnalysisUpdatedEvent = {
  analysisId: string
  status: AnalysisStatus
}

const apiOrigin = API_BASE_URL.startsWith('/')
  ? window.location.origin
  : API_BASE_URL.replace(/\/api\/v1\/?$/, '')

export function subscribeToAnalysisUpdates(
  analysisId: string,
  onRefreshNeeded: () => void,
  onConnectionError?: (message: string) => void,
): () => void {
  const token = localStorage.getItem('token')
  if (!token) return () => undefined

  const socket = io(apiOrigin, {
    auth: { token },
  })

  const handleUpdate = (event: AnalysisUpdatedEvent) => {
    if (event.analysisId === analysisId && event.status !== 'Pending') {
      onRefreshNeeded()
    }
  }

  socket.on('analysis_updated', handleUpdate)
  // Refresh once connected so a fast analysis completion cannot be missed
  // between the initial HTTP response and the socket handshake.
  socket.on('connect', onRefreshNeeded)
  socket.on('connect_error', (error) => {
    if (error.message === 'Invalid or inactive session') {
      invalidateSession('Your session expired or became invalid. Please sign in again.')
      return
    }
    onConnectionError?.(
      'Real-time updates are unavailable. Status will refresh automatically.',
    )
  })

  return () => {
    socket.off('analysis_updated', handleUpdate)
    socket.off('connect', onRefreshNeeded)
    socket.off('connect_error')
    socket.disconnect()
  }
}
