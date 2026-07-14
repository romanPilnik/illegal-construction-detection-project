export type UserRole = 'Admin' | 'Inspector'

export type AnalysisStatus = 'Pending' | 'Completed' | 'Failed'

export type ActionStatus = 'Success' | 'Failure'

export type PaginationMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
}
