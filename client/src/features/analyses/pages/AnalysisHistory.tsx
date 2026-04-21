import { useEffect, useState, useCallback } from "react";
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

    // Filters State
    const [statusFilter, setStatusFilter] = useState<StatusType>("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const today = new Date().toISOString().split('T')[0];

    const fetchData = useCallback(async () => {
        if (startDate && endDate && startDate > endDate) {
            setError("Start date cannot be later than end date");
            setAnalyses([]);
            return;
        }

        setError("");
        setLoading(true);

        try {
            const payload = await getAnalyses({
                page: 1,
                limit: 50,
                status: statusFilter || undefined,
                // שליחת התאריכים בצורה נקייה (YYYY-MM-DD)
                start_date: startDate || undefined,
                end_date: endDate || undefined
            });
            setAnalyses(payload.data ?? []);
        } catch (err) {
            if (isAxiosError(err)) {
                if (err.response?.status === 400 || err.response?.data?.message?.includes('Validation')) {
                    setError("");
                } else {
                    setError(err.response?.data?.message ?? "Failed to load analyses");
                }
            } else {
                setError("Failed to load analyses");
            }
            setAnalyses([]);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, startDate, endDate]);

    useEffect(() => {
        void fetchData();
    }, []);

    const handleReset = async () => {
        setStartDate("");
        setEndDate("");
        setStatusFilter("");
        setError("");
        setLoading(true);

        try {
            const payload = await getAnalyses({ page: 1, limit: 50 });
            setAnalyses(payload.data ?? []);
        } catch {
            setError("Failed to reset list");
            setAnalyses([]);
        } finally {
            setLoading(false);
        }
    };

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
            alert("Export failed");
        } finally {
            setExporting(null);
        }
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleString();
        } catch { return iso; }
    };

    return (
        <div className="min-h-screen bg-[#f0f4f8] pt-8 [font-:'Segoe_UI',system-ui,sans-serif]">
            <div className="mx-auto mb-8 max-w-[1100px]">
                <h1 className="mb-6 text-[2rem] font-bold text-[#1e293b]">Analysis History</h1>
            </div>

            {/* Header Control Bar */}
            <div className="mx-auto mb-6 max-w-[1100px] border-b border-t border-[#e2e8f0] bg-white px-8 py-4 shadow-sm flex justify-between items-center rounded-lg">
                <button
                    onClick={() => navigate("/")}
                    className="text-sm font-semibold text-[#64748b] hover:text-sky-600 transition-colors"                >
                    ← Back to Dashboard
                </button>
                <div className="text-right">
                    <h2 className="text-lg font-bold text-[#1e293b]">Record Management</h2>
                    <p className="text-xs text-[#64748b]">Search and manage historical analysis results</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="mx-auto my-6 max-w-[1100px] rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-end gap-4"> {/* הוספתי את המילה div כאן */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">From</label>
                        <input
                            type="date"
                            max={today}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-sky-300 outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">To</label>
                        <input
                            type="date"
                            max={today}
                            min={startDate}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusType)}
                            className="px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#3b82f6] cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Failed">Failed</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchData}
                        className="px-6 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-sm font-bold hover:bg-sky-100 transition-all shadow-sm active:scale-95"
                    >
                        🔍 Search
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-sm font-bold hover:bg-sky-100 transition-all shadow-sm active:scale-95"
                    >
                        ✖ Reset
                    </button>
                    <div className="flex gap-2 ml-auto">
                        <button
                            disabled={exporting !== null}
                            onClick={() => handleBulkExport('PDF')}
                            className="min-w-[140px] px-4 py-2 bg-white text-sky-600 border border-sky-200 rounded-lg text-xs font-bold hover:bg-sky-50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                            {exporting === 'PDF' ? 'Exporting...' : '📄 Export PDF'}
                        </button>
                        <button
                            disabled={exporting !== null}
                            onClick={() => handleBulkExport('EXCEL')}
                            className="min-w-[140px] px-4 py-2 bg-white text-sky-600 border border-sky-200 rounded-lg text-xs font-bold hover:bg-sky-50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"                        >
                            {exporting === 'EXCEL' ? 'Exporting...' : '📊 Export Excel'}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mx-auto mb-6 max-w-[1100px] rounded-lg bg-red-50 px-4 py-3 text-red-700 border border-red-100 text-sm">
                    ⚠️ {error}
                </div>
            )}

            <div className="mx-auto my-8 max-w-[1100px]">
                {loading ? (
                    <p className="py-20 text-center text-[#64748b] animate-pulse">Fetching records...</p>
                ) : analyses.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-xl border border-dashed border-[#cbd5e1]">
                        <p className="text-[#64748b]">No records found for the selected criteria.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {analyses.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => navigate(`/analyses/${item.id}`)}
                                className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e2e8f0] bg-white px-6 py-4 shadow-sm transition-all hover:border-sky-300 hover:shadow-md group"                            >
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-tighter">ID</span>
                                        <span className="text-sm font-mono text-[#334155]">{item.id.substring(0, 12)}...</span>
                                    </div>
                                    <span className={statusBadgeClasses(item.status)}>{item.status}</span>
                                    <div className="flex flex-col border-l pl-6 border-[#f1f5f9]">
                                        <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-tighter">Created At</span>
                                        <span className="text-sm text-[#64748b]">{formatDate(item.created_at)}</span>
                                    </div>
                                </div>
                                <div className="text-[#94a3b8] group-hover:text-sky-600 transition-all transform group-hover:translate-x-1">Details →</div>                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}