import { api } from '../../services/api'
import type {
    AnalysesListResponse,
    AnalysisDetailResponse,
    CreateAnalysisResponse,
} from './types'

export async function getAnalyses(params: {
    page: number
    limit: number
}): Promise<AnalysesListResponse> {
    const res = await api.get<AnalysesListResponse>('/analyses', { params })
    return res.data
}

export async function getAnalysisById(id: string): Promise<AnalysisDetailResponse> {
    const res = await api.get<AnalysisDetailResponse>(`/analyses/${id}`)
    return res.data
}

export async function createAnalysis(formData: FormData): Promise<CreateAnalysisResponse> {
    const res = await api.post<CreateAnalysisResponse>('/analyses/analyse', formData)
    return res.data
}
