export type AuditLogRow = {
    id: string
    action: string
    timestamp: string
    status: string
    details: string | null
    user: { username: string; email: string; role: string }
}

export type AuditLogsListMeta = {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
}

export type AuditLogsResponse = {
    data: AuditLogRow[]
    meta: AuditLogsListMeta
}
