import { api } from '../../services/api'
import type { AuditLogsResponse } from './types'

const PAGE_LIMIT = 10

export async function getAuditLogs(params: {
    page: number
    limit?: number
    action?: string
}): Promise<AuditLogsResponse> {
    const limit = params.limit ?? PAGE_LIMIT
    const query: Record<string, string | number> = {
        page: params.page,
        limit,
    }
    if (params.action?.trim()) {
        query.action = params.action.trim()
    }
    const res = await api.get<AuditLogsResponse>('/logs', { params: query })
    return res.data
}

export { PAGE_LIMIT as AUDIT_LOGS_PAGE_LIMIT }
