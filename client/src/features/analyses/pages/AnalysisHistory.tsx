import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { getAnalyses, exportAnalysesByDate } from "../api";
import type { AnalysisListRow } from "../types";

type StatusType = 'Pending' | 'Completed' | 'Failed' | "";

function statusBadgeClasses(status: string) {
    const key = status.toLowerCase();
    const base = "rounded-full px-3 py-1 text-xs font-semibold";
    if (key === "completed") return `${base} bg-[#dcfce3] text-[#166534]`;
    if (key === "pending") return `${base} bg-[#fef3c7] text-[#92400e]`;
    if (key === "failed") return `${base} bg-[#fee2e2] text-[#991b1b]`;
    return base;
}

export default function AnalysisHistory() {
    const navigate = useNavigate();
    const [analyses, setAnalyses] = useState([] as AnalysisListRow[]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<'PDF' | 'EXCEL' | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusType>("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    //const [exporting, setExporting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const payload = await getAnalyses({
                    page: 1,
                    limit: 50,
                    status: statusFilter || undefined
                });
                if (!cancelled) {
                    setAnalyses(payload.data ?? []);
                }
            } catch (err) {
                if (!cancelled) {
                    if (isAxiosError(err)) {
                        const data = err.response?.data as { message?: string } | undefined;
                        setError(data?.message ?? "Failed to load analyses");
                    } else {
                        setError("Failed to load analyses");
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [statusFilter]);

    const handleBulkExport = async (format: 'PDF' | 'EXCEL') => {
        setExporting(format);
        try {
            const res = await exportAnalysesByDate({
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                format
            });

            const link = document.createElement('a');
            link.href = res.downloadUrl;
            link.setAttribute('download', `Bulk_Report_${Date.now()}.${format.toLowerCase()}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            alert("ייצוא נכשל");
        } finally {
            setExporting(null);
        }
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return iso;
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f4f8] pt-8 [font-:'Segoe_UI',system-ui,sans-serif]">
            <div className="mx-auto mb-8 max-w-[1000px]">
                <h1 className="mb-6 text-[2rem] font-bold text-[#1e293b]">
                    Analysis History
                </h1>
            </div>

            <div className="flex items-center justify-between border-b border-t border-[#e2e8f0] bg-white px-8 py-4 shadow-sm">
                <div className="flex items-center gap-8">
                    <button
                        type="button"
                        className="flex cursor-pointer items-center gap-2 border-none bg-transparent text-sm font-semibold text-[#64748b] hover:text-[#2563eb] transition-colors"
                        onClick={() => navigate("/")}
                    >
                        ← Back to Dashboard
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-[#1e293b]">Analysis Management</h2>
                        <p className="text-xs text-[#64748b]">View and filter historical results</p>
                    </div>
                </div>
            </div>

            <div className="mx-auto my-6 max-w-[1000px] rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-end gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">From Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none text-[#334155]"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">To Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none text-[#334155]"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusType)}
                            className="px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none text-[#334155] bg-white cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Failed">Failed</option>
                        </select>
                    </div>

                    <div className="flex gap-2 ml-auto">
                        <button
                            disabled={exporting !== null}
                            onClick={() => handleBulkExport('PDF')}
                            className="min-w-[140px] px-4 py-2 bg-green-50 text-green-600 border border-green-100 rounded-lg text-xs font-bold hover:bg-green-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {exporting === 'PDF' ? 'Exporting...' : '📄 PDF Report'}
                        </button>

                        <button
                            disabled={exporting !== null}
                            onClick={() => handleBulkExport('EXCEL')}
                            className="min-w-[140px] px-4 py-2 bg-green-50 text-green-600 border border-green-100 rounded-lg text-xs font-bold hover:bg-green-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {exporting === 'EXCEL' ? 'Exporting...' : '📊 Excel Sheet'}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mx-auto mb-6 max-w-[1000px] rounded-lg bg-[#fef2f2] px-4 py-4 text-[#b91c1c] border border-red-100">
                    {error}
                </div>
            )}

            <div className="mx-auto my-8 max-w-[1000px]">
                {loading ? (
                    <p className="px-8 py-8 text-center text-[#64748b]">Loading history…</p>
                ) : analyses.length === 0 ? (
                    <p className="px-8 py-8 text-center text-[#64748b]">No records found for this filter.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {analyses.map((item) => (
                            <div
                                key={item.id}
                                role="button"
                                tabIndex={0}
                                className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e2e8f0] bg-white px-6 py-4 shadow-sm transition-all hover:border-[#3b82f6] hover:shadow-md group"
                                onClick={() => navigate(`/analyses/${item.id}`)}
                            >
                                <div className="flex flex-wrap items-center gap-6">
                                    <div className="flex items-center gap-3 font-semibold text-[#1e293b]">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors text-xs">
                                            DOC
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-sm">Analysis Record</span>
                                            <span className="text-[10px] text-[#94a3b8] font-mono">{item.id.substring(0, 8)}...</span>
                                        </div>
                                    </div>
                                    <span className={statusBadgeClasses(item.status)}>
                                        {item.status}
                                    </span>
                                    <span className="text-sm text-[#64748b]">
                                        {formatDate(item.created_at)}
                                    </span>
                                </div>
                                <div className="text-[#94a3b8] group-hover:translate-x-1 transition-transform">→</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}