import { api } from '../../services/api'
import type { AnalysesListMeta } from './types'

export async function getAnalysesMeta(params: {
    status?: 'Pending' | 'Completed' | 'Failed'
}): Promise<AnalysesListMeta> {
    const res = await api.get<{ meta: AnalysesListMeta }>('/analyses', {
        params: {
            page: 1,
            limit: 1,
            ...(params.status ? { status: params.status } : {}),
        },
    })
    return res.data.meta
}
