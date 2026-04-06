import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../services/api'

type AnalysisRow = {
    id: string
    status: string
    created_at: string
}

type AnalysesListResponse = {
    data: AnalysisRow[]
}

function statusBadgeClasses(status: string) {
    const key = status.toLowerCase()
    const base = 'rounded-full px-3 py-1 text-xs font-semibold'
    if (key === 'completed') return `${base} bg-[#dcfce3] text-[#166534]`
    if (key === 'pending') return `${base} bg-[#fef3c7] text-[#92400e]`
    if (key === 'failed') return `${base} bg-[#fee2e2] text-[#991b1b]`
    return base
}

export default function AnalysisHistory() {
    const navigate = useNavigate()
    const [analyses, setAnalyses] = useState([] as AnalysisRow[])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const res = await api.get('/analyses', {
                    params: { page: 1, limit: 50 },
                })
                const payload = res.data as AnalysesListResponse
                if (!cancelled) {
                    setAnalyses(payload.data ?? [])
                }
            } catch (err) {
                if (!cancelled) {
                    if (isAxiosError(err)) {
                        const data = err.response?.data as { message?: string } | undefined
                        setError(data?.message ?? 'Failed to load analyses')
                    } else {
                        setError('Failed to load analyses')
                    }
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleString()
        } catch {
            return iso
        }
    }

    return (
        <div className="min-h-screen bg-[#f0f4f8] pt-8 [font-family:'Segoe_UI',system-ui,sans-serif]">
            <div className="mx-auto mb-8 max-w-[1000px]">
                <h1 className="mb-6 text-[2rem] font-bold text-[#1e293b]">Analysis Page:</h1>
            </div>
            <div className="flex items-center gap-8 border-b border-t border-[#e2e8f0] bg-white px-8 py-4">
                <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2 border-none bg-transparent text-sm font-semibold text-[#64748b] hover:text-[#2563eb]"
                    onClick={() => navigate('/')}
                >
                    ← Back to Dashboard
                </button>
                <div>
                    <h2 className="text-lg font-bold text-[#1e293b]">Analysis History</h2>
                    <p className="text-xs text-[#64748b]">View all submitted analyses and results</p>
                </div>
            </div>
            {error && (
                <div className="mx-auto mb-0 max-w-[1000px] rounded-lg bg-[#fef2f2] px-4 py-4 text-[#b91c1c]">
                    {error}
                </div>
            )}
            <div className="mx-auto my-8 max-w-[1000px]">
                {loading ? (
                    <p className="px-8 py-8 text-center text-[#64748b]">Loading…</p>
                ) : analyses.length === 0 ? (
                    <p className="px-8 py-8 text-center text-[#64748b]">No analyses yet.</p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {analyses.map(item => (
                            <div
                                key={item.id}
                                role="button"
                                tabIndex={0}
                                className="flex cursor-pointer items-center justify-between rounded-lg border border-[#e2e8f0] bg-white px-6 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors duration-200 hover:border-[#cbd5e1]"
                                onClick={() => navigate(`/analyses/${item.id}`)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        navigate(`/analyses/${item.id}`)
                                    }
                                }}
                            >
                                <div className="flex flex-wrap items-center gap-6">
                                    <div className="flex items-center gap-2 font-semibold text-[#1e293b]">
                                        <span className="text-[#3b82f6]">📄</span> Analysis
                                    </div>
                                    <span className={statusBadgeClasses(item.status)}>{item.status}</span>
                                    <span className="text-sm text-[#64748b]">{formatDate(item.created_at)}</span>
                                </div>
                                <div className="text-[#94a3b8]">⌄</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
