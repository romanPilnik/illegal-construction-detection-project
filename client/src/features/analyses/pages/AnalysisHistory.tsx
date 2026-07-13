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

/** Empty while waiting on AI (pending). */
function aiResultLabel(status: string, anomalyDetected: boolean | null): string {
    const key = status.toLowerCase();
    if (key === "pending" || key === "processing") return "";
    if (key !== "completed") return "";
    if (anomalyDetected === true) return "Vulnerability found";
    if (anomalyDetected === false) return "Normal";
    return "";
}

function aiResultCellClass(label: string) {
    if (!label) return "text-sm text-slate-600";
    if (label === "Vulnerability found") return "text-sm font-medium text-rose-300";
    return "text-sm font-medium text-emerald-300";
}

const ROW_GRID =
    "grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)_minmax(0,1fr)_5rem] items-center gap-x-4 gap-y-1 px-6 py-3.5";

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

    const hasActiveFilters = Boolean(statusFilter || startDate || endDate);

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
        <div className="app-page pt-8">
            <div className="mx-auto mb-8 max-w-[1100px]">
                <h1 className="page-title mb-6 text-[2rem] font-bold">Analysis History</h1>
            </div>

            {/* Header Control Bar */}
            <div className="glass-card mx-auto mb-6 flex max-w-[1100px] items-center justify-between rounded-lg px-8 py-4">
                <button
                    onClick={() => navigate("/")}
                    className="text-sm font-semibold text-slate-300 transition-colors hover:text-sky-300"                >
                    ← Back to Dashboard
                </button>
                <div className="text-right">
                    <h2 className="text-lg font-bold text-slate-100">Record Management</h2>
                    <p className="text-xs text-slate-400">Search and manage historical analysis results</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="glass-card mx-auto my-6 max-w-[1100px] rounded-xl p-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">From</label>
                        <input
                            type="date"
                            max={today}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="rounded-lg border border-white/15 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-300"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">To</label>
                        <input
                            type="date"
                            max={today}
                            min={startDate}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="rounded-lg border border-white/15 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusType)}
                            className="cursor-pointer rounded-lg border border-white/15 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Failed">Failed</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchData}
                    className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-6 py-2 text-sm font-bold text-sky-300 shadow-sm transition-all active:scale-95 hover:bg-sky-500/20"
                    >
                        🔍 Search
                    </button>
                    <button
                        onClick={handleReset}
                        disabled={!hasActiveFilters || loading}
                        className="rounded-lg border border-slate-500/40 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 shadow-sm transition-all active:scale-95 hover:enabled:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        ✖ Reset
                    </button>
                    <div className="ml-auto flex gap-2">
                        <button
                            type="button"
                            disabled={exporting !== null}
                            onClick={() => handleBulkExport('PDF')}
                            className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-all hover:bg-white/10 disabled:opacity-50"
                        >
                            {exporting === 'PDF' ? 'Generating…' : '📄 Export PDF'}
                        </button>
                        <button
                            type="button"
                            disabled={exporting !== null}
                            onClick={() => handleBulkExport('EXCEL')}
                            className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-all hover:bg-white/10 disabled:opacity-50"
                        >
                            {exporting === 'EXCEL' ? 'Generating…' : '📊 Export Excel'}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mx-auto mb-6 max-w-[1100px] rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    ⚠️ {error}
                </div>
            )}

            <div className="mx-auto my-8 max-w-[1100px]">
                {loading ? (
                    <p className="animate-pulse py-20 text-center text-slate-400">Fetching records...</p>
                ) : analyses.length === 0 ? (
                    <div className="glass-card rounded-xl border border-dashed border-white/20 py-20 text-center">
                        <p className="text-slate-400">No records found for the selected criteria.</p>
                    </div>
                ) : (
                    <div className="glass-card overflow-hidden rounded-xl border border-white/10">
                        <div
                            className={`${ROW_GRID} border-b border-white/10 bg-white/[0.04] text-left`}
                            role="row"
                        >
                            <div
                                className="text-xs font-bold uppercase tracking-wider text-slate-500"
                                role="columnheader"
                            >
                                Request Name
                            </div>
                            <div
                                className="text-xs font-bold uppercase tracking-wider text-slate-500"
                                role="columnheader"
                            >
                                Analysis ID
                            </div>
                            <div
                                className="text-xs font-bold uppercase tracking-wider text-slate-500"
                                role="columnheader"
                            >
                                Status
                            </div>
                            <div
                                className="text-xs font-bold uppercase tracking-wider text-slate-500"
                                role="columnheader"
                            >
                                Date created
                            </div>
                            <div
                                className="text-xs font-bold uppercase tracking-wider text-slate-500"
                                role="columnheader"
                            >
                                Result
                            </div>
                            <div
                                className="text-right text-xs font-bold uppercase tracking-wider text-slate-500"
                                role="columnheader"
                            >
                                {"\u00a0"}
                            </div>
                        </div>
                        <div className="divide-y divide-white/10" role="list">
                            {analyses.map((item) => {
                                const resultText = aiResultLabel(
                                    item.status,
                                    item.anomaly_detected,
                                );
                                return (
                                    <div
                                        key={item.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => navigate(`/analyses/${item.id}`)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                navigate(`/analyses/${item.id}`);
                                            }
                                        }}
                                        className={`${ROW_GRID} group cursor-pointer text-left transition-colors hover:bg-white/[0.06]`}
                                    >
                                        <div
                                            className="min-w-0 truncate text-sm font-medium text-slate-100"
                                            title={item.request_title ?? "Untitled"}
                                        >
                                            {item.request_title?.trim() || "Untitled"}
                                        </div>
                                        <div
                                            className="min-w-0 font-mono text-sm text-slate-400"
                                            title={item.id}
                                        >
                                            {item.id.substring(0, 12)}…
                                        </div>
                                        <div>
                                            <span className={statusBadgeClasses(item.status)}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <div className="min-w-0 text-sm text-slate-400">
                                            {formatDate(item.created_at)}
                                        </div>
                                        <div className={`min-h-[1.25rem] ${aiResultCellClass(resultText)}`}>
                                            {resultText || "\u00a0"}
                                        </div>
                                        <div className="text-right text-sm text-slate-500 transition-all group-hover:translate-x-0.5 group-hover:text-sky-300">
                                            Details →
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}