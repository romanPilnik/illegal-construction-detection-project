export type AnalysisStatus = 'Pending' | 'Completed' | 'Failed'

export type AnalysisListRow = {
    id: string
    status: string
    created_at: string
}

export type AnalysesListMeta = {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
}

export type AnalysesListResponse = {
    data: AnalysisListRow[]
    meta: AnalysesListMeta
}

export type CreateAnalysisResponse = {
    message: string
    analysisId: string
    location_address?: string
}

export type AnalysisDetailData = {
    id: string
    status: string
    created_at: string
    anomaly_detected: boolean | null
    inspector_id: string
    issued_by?: { id: string; username: string }
    before_image?: { file_path: string }
    after_image?: { file_path: string }
    result_image?: { file_path: string }
}

export type AnalysisDetailResponse = {
    data: AnalysisDetailData
}
