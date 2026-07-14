import type { AnalysisStatus, PaginationMeta } from '../../types/domain'

export type { AnalysisStatus } from '../../types/domain'

export type AnalysisListRow = {
    id: string
    status: AnalysisStatus
    created_at: string
    request_title: string | null
    anomaly_detected: boolean | null
}

export type AnalysesListMeta = PaginationMeta

export type AnalysesListResponse = {
    data: AnalysisListRow[]
    meta: AnalysesListMeta
}

export type CreateAnalysisResponse = {
    message: string
    analysisId: string
    request_title: string
    data: { id: string }
}

export type AnalysisDetailData = {
    id: string
    status: AnalysisStatus
    failure_reason: string | null
    created_at: string
    request_title: string | null
    anomaly_detected: boolean | null
    issued_by: { username: string }
    before_image: { file_path: string }
    after_image: { file_path: string }
    result_image: { file_path: string } | null
}

export type AnalysisDetailResponse = {
    data: AnalysisDetailData
}

export type GetAnalysesQuery = {
    page: number
    limit: number
    status?: AnalysisStatus
    start_date?: string
    end_date?: string
}

export type ExportFormat = 'PDF' | 'EXCEL'

export type ExportAnalysisResponse = {
    message: string
    downloadUrl: string
}

export type ExportAnalysesByDateBody = {
    start_date?: string
    end_date?: string
    format: ExportFormat
}
