import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../services/api'

type AuditLogRow = {
    id: string
    action: string
    timestamp: string
    status: string
    details: string | null
    user: { username: string; email: string; role: string }
}

type AuditLogsResponse = {
    data: AuditLogRow[]
}

const cell = 'border-b border-[#e2e8f0] px-4 py-3 text-left'
const head = `${cell} bg-[#f8fafc] font-semibold text-[#475569]`

export default function AuditLogs() {
    const navigate = useNavigate()
    const [logs, setLogs] = useState([] as AuditLogRow[])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const res = await api.get('/logs', {
                    params: { page: 1, limit: 25 },
                })
                const payload = res.data as AuditLogsResponse
                if (!cancelled) setLogs(payload.data ?? [])
            } catch (err) {
                if (!cancelled) {
                    if (axios.isAxiosError(err)) {
                        setError(
                            err.response?.data?.message ?? 'Failed to load logs'
                        )
                    } else {
                        setError('Failed to load logs')
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

    return (
        <div className="min-h-screen bg-[#f0f4f8] pt-8 [font-family:'Segoe_UI',system-ui,sans-serif]">
            <div className="mx-auto mb-4 max-w-[1100px] px-4">
                <h1 className="text-[2rem] font-bold text-[#1e293b]">Audit logs</h1>
            </div>
            <div className="flex items-center gap-8 border-b border-t border-[#e2e8f0] bg-white px-8 py-4">
                <button
                    type="button"
                    className="cursor-pointer border-none bg-transparent text-sm font-semibold text-[#64748b] hover:text-[#2563eb]"
                    onClick={() => navigate('/')}
                >
                    ← Back to Dashboard
                </button>
            </div>
            {error && <p className="mx-auto my-4 max-w-[1100px] px-4 text-[#b91c1c]">{error}</p>}
            <div className="mx-auto my-8 max-w-[1100px] overflow-auto rounded-xl border border-[#e2e8f0] bg-white">
                {loading ? (
                    <p className="px-8 py-8 text-center text-[#64748b]">Loading…</p>
                ) : logs.length === 0 ? (
                    <p className="px-8 py-8 text-center text-[#64748b]">No log entries.</p>
                ) : (
                    <table className="w-full border-collapse text-left text-sm">
                        <thead>
                            <tr>
                                <th className={head}>Time</th>
                                <th className={head}>User</th>
                                <th className={head}>Action</th>
                                <th className={head}>Status</th>
                                <th className={head}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td className={cell}>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className={cell}>{log.user?.username ?? '—'}</td>
                                    <td className={cell}>{log.action}</td>
                                    <td className={cell}>{log.status}</td>
                                    <td className={cell}>{log.details ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
