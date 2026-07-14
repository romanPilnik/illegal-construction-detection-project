import type { ActionStatus, PaginationMeta } from '../../types/domain'

export type { ActionStatus } from '../../types/domain'

export type AuditLogRow = {
    id: string
    action: string
    ip_address: string
    timestamp: string
    status: ActionStatus
    details: string | null
    user: { username: string }
}

export type AuditLogsListMeta = PaginationMeta

export type AuditLogsResponse = {
    data: AuditLogRow[]
    meta: AuditLogsListMeta
}
