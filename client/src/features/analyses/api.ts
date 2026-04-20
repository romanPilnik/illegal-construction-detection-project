import { api } from '../../services/api'
import type {
    AnalysesListResponse,
    AnalysisDetailResponse,
    CreateAnalysisResponse,
} from './types'

export async function getAnalyses(params: {
    page: number
    limit: number
    status?: 'Pending' | 'Completed' | 'Failed';
    start_date?: string;
    end_date?: string;
}): Promise<AnalysesListResponse> {
    const res = await api.get<AnalysesListResponse>('/analyses', { params })
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

export async function exportAnalysisById(id: string, format: 'PDF' | 'EXCEL') {
    const res = await api.post<{ downloadUrl: string }>(`/analyses/${id}/export`, { format });
    return res.data;
}

export async function exportAnalysesByDate(params: {
    start_date?: string;
    end_date?: string;
    format: 'PDF' | 'EXCEL'
}) {
    const res = await api.post<{ downloadUrl: string }>('/analyses/export', params);
    return res.data;
}
//export async function createAnalysis(formData: FormData): Promise<CreateAnalysisResponse> {
//    const res = await api.post<CreateAnalysisResponse>('/analyses/analyse', formData)
//    return res.data
//}
