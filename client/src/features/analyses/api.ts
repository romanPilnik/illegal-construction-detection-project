import { api } from '../../services/api'
import type {
    AnalysesListResponse,
    AnalysisDetailResponse,
    CreateAnalysisResponse,
    ExportAnalysesByDateBody,
    ExportAnalysisResponse,
    ExportFormat,
    GetAnalysesQuery,
} from './types'

const LOCAL_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

export async function getAnalyses(params: GetAnalysesQuery): Promise<AnalysesListResponse> {
    const res = await api.get<AnalysesListResponse>('/analyses', {
        params: { ...params, time_zone: LOCAL_TIME_ZONE },
    })
    return res.data
}

export async function getAnalysisById(id: string): Promise<AnalysisDetailResponse> {
    const res = await api.get<AnalysisDetailResponse>(`/analyses/${id}`)
    return res.data
}

export async function createAnalysis(formData: FormData): Promise<CreateAnalysisResponse> {
    const res = await api.post<CreateAnalysisResponse>('/analyses/analyse', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    return res.data
}

export async function exportAnalysisById(
    id: string,
    format: ExportFormat,
): Promise<ExportAnalysisResponse> {
    const res = await api.post<ExportAnalysisResponse>(`/analyses/${id}/export`, { format });
    return res.data;
}

export async function exportAnalysesByDate(
    params: ExportAnalysesByDateBody,
): Promise<ExportAnalysisResponse> {
    const res = await api.post<ExportAnalysisResponse>('/analyses/export', {
        ...params,
        time_zone: LOCAL_TIME_ZONE,
    });
    return res.data;
}
