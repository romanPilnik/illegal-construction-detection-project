import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAnalysisById, exportAnalysisById } from "../api";
import type { AnalysisDetailData, AnalysisStatus } from "../types";
import { AnalysisSubmitLoader } from "../../../components/AnalysisSubmitLoader";
import { subscribeToAnalysisUpdates } from "../socket";
import { getApiErrorMessage } from "../../../lib/api-error";

const viteApiUrl =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1";
const API_ORIGIN = viteApiUrl.startsWith("/")
  ? ""
  : viteApiUrl.replace(/\/api\/v1\/?$/, "");

export default function AnalysisDetail() {
    const { analysisId } = useParams<{ analysisId: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState(null as AnalysisDetailData | null);
    const [error, setError] = useState("");
    const [refreshWarning, setRefreshWarning] = useState("");
    const [loading, setLoading] = useState(true);

    const [exporting, setExporting] = useState<"PDF" | "EXCEL" | null>(null);

    const getImageUrl = (path: string | undefined) => {
        if (!path) return "";
        const cleanPath = path.replace(/\\/g, "/").replace(/^\//, "");
        if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
        if (API_ORIGIN === "") {
            return `/${cleanPath}`;
        }
        return `${API_ORIGIN.replace(/\/$/, "")}/${cleanPath}`;
    };

    const handleExport = async (format: 'PDF' | 'EXCEL') => {
        if (!data?.id) return;
        setExporting(format);
        try {
            const res = await exportAnalysisById(data.id, format);

            const link = document.createElement('a');
            link.href = res.downloadUrl;
            link.setAttribute('download', `Report_${data.id}.${format.toLowerCase()}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Export failed", err);
            alert(getApiErrorMessage(err, "Failed to export analysis."));
        } finally {
            setExporting(null);
        }
    };

    const getAnomalyBadge = (status: AnalysisStatus, hasAnomaly: boolean | null) => {
        const baseClasses =
            "inline-flex min-h-[1.5rem] items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm border";

        const key = status.toLowerCase();
        if (key === "pending" || key === "processing") {
            return {
                classes: `${baseClasses} border-amber-300 bg-amber-100 text-amber-900`,
                text: "Processing",
            };
        }

        if (key === "failed") {
            return {
                classes: `${baseClasses} border-slate-400 bg-slate-200 text-slate-900`,
                text: "Failed",
            };
        }

        if (hasAnomaly === true) {
            return {
                classes: `${baseClasses} border-red-300 bg-red-100 text-red-900`,
                text: "Anomaly detected",
            };
        }

        if (hasAnomaly === false) {
            return {
                classes: `${baseClasses} border-emerald-300 bg-emerald-100 text-emerald-900`,
                text: "No anomaly detected",
            };
        }

        return {
            classes: `${baseClasses} border-sky-300 bg-sky-100 text-sky-900`,
            text: "Result pending",
        };
    };

    useEffect(() => {
        if (!analysisId) {
            setLoading(false);
            setError("Missing analysis id");
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const payload = await getAnalysisById(analysisId);
                if (!cancelled) setData(payload.data);
            } catch (err) {
                if (!cancelled) {
                    setError(getApiErrorMessage(err, "Could not load analysis."));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [analysisId]);

    const analysisStatus = data?.status;

    useEffect(() => {
        if (!analysisId || analysisStatus !== "Pending") return;

        const poll = window.setInterval(() => {
            void getAnalysisById(analysisId)
                .then((payload) => {
                    setData(payload.data);
                    setRefreshWarning("");
                })
                .catch((err) => {
                    setRefreshWarning(getApiErrorMessage(err, "Could not refresh analysis status."));
                });
        }, 3000);

        return () => window.clearInterval(poll);
    }, [analysisId, analysisStatus]);

    const isProcessing = data?.status === "Pending";

    useEffect(() => {
        if (!analysisId) return;

        let cancelled = false;
        const refresh = async () => {
            try {
                const payload = await getAnalysisById(analysisId);
                if (!cancelled) {
                    setData(payload.data);
                    setRefreshWarning("");
                }
            } catch (err) {
                if (!cancelled) {
                    setRefreshWarning(getApiErrorMessage(err, "Could not refresh analysis."));
                }
            }
        };

        const unsubscribe = subscribeToAnalysisUpdates(
            analysisId,
            () => void refresh(),
            setRefreshWarning,
        );
        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [analysisId]);

    return (
        <div className="app-page pt-8">
            {(loading || isProcessing) && (
                <AnalysisSubmitLoader
                    title={loading ? "Loading analysis" : "AI analysis in progress"}
                    subtitle={
                        loading
                            ? "Fetching your submission details…"
                            : "Our detection model is comparing before/after imagery. This may take a minute."
                    }
                />
            )}
            {/* Header Bar */}
            <div className="glass-card mx-auto flex max-w-[900px] items-center justify-between px-8 py-4">
                <button
                    type="button"
                    className="cursor-pointer border-none bg-transparent text-sm font-semibold text-slate-300 transition-colors hover:text-[#60a5fa]"
                    onClick={() => navigate("/analyses")}
                >
                    ← Back to list
                </button>

                {/* Export Actions */}
                {!loading && !error && data && (
                    <div className="flex gap-3">
                        <button
                            type="button"
                            disabled={exporting !== null}
                            onClick={() => handleExport('PDF')}
                            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-all active:scale-95 hover:bg-white/10 disabled:opacity-50"
                        >
                            {exporting === 'PDF' ? 'Generating…' : '📄 PDF Report'}
                        </button>
                        <button
                            type="button"
                            disabled={exporting !== null}
                            onClick={() => handleExport('EXCEL')}
                            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-all active:scale-95 hover:bg-white/10 disabled:opacity-50"
                        >
                            {exporting === 'EXCEL' ? 'Generating…' : '📊 Excel Sheet'}
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="glass-card mx-auto my-8 max-w-[900px] rounded-xl px-8 py-6">
                {loading && <p className="animate-pulse p-8 text-center text-slate-400">Loading analysis data...</p>}
                {!loading && error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</p>}

                {!loading && data && refreshWarning && (
                    <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
                        {refreshWarning}
                    </p>
                )}

                {!loading && data && (
                    <>
                        {/* Info Grid */}
                        <div className="mb-8 grid grid-cols-2 gap-4 border-b border-white/10 pb-6">
                            <div>
                                <div className="mb-2 text-[0.85rem] font-bold uppercase tracking-wider text-slate-500">General Info</div>
                                <div className="mb-1 text-[0.9rem] text-slate-200"><span className="mr-2 font-semibold text-slate-400">Request:</span>{data.request_title?.trim() || "Untitled"}</div>
                                <div className="mb-1 text-[0.9rem] text-slate-200"><span className="mr-2 font-semibold text-slate-400">Status:</span>{data.status}</div>
                            </div>
                            <div>
                                <div className="mb-2 text-[0.85rem] font-bold uppercase tracking-wider text-slate-500">History</div>
                                <div className="mb-1 text-[0.9rem] text-slate-200"><span className="mr-2 font-semibold text-slate-400">Created:</span>{new Date(data.created_at).toLocaleString()}</div>
                                <div className="mb-1 text-[0.9rem] text-slate-200"><span className="mr-2 font-semibold text-slate-400">Inspector:</span>{data.issued_by?.username || 'System'}</div>
                            </div>
                        </div>

                        {/* Anomaly Badge */}
                        <div className="mb-6 flex items-center rounded-lg border border-white/10 bg-white/5 p-4">
                            <span className="mr-3 font-bold text-slate-200">Analysis Status:</span>

                            {(() => {
                                const badge = getAnomalyBadge(data.status, data.anomaly_detected);
                                return (
                                    <span className={badge.classes}>
                                    {badge.text}
                                </span>
                                );
                            })()}
                        </div>

                        {data.status === "Failed" && data.failure_reason && (
                            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                                {data.failure_reason}
                            </div>
                        )}

                        {/* Images Stack */}
                        <div className="space-y-10">
                            {data.before_image && (
                                <div className="group">
                                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#64748b]">
                                        <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full"></span>
                                        Before Construction
                                    </div>
                                    <img
                                        src={getImageUrl(data.before_image.file_path)}
                                        alt="State Before"
                                        className="max-h-[450px] w-full object-cover rounded-xl border border-[#e2e8f0] shadow-sm transition-transform hover:scale-[1.005]"
                                    />
                                </div>
                            )}

                            {data.after_image && (
                                <div className="group">
                                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#64748b]">
                                        <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full"></span>
                                        After Construction
                                    </div>
                                    <img
                                        src={getImageUrl(data.after_image.file_path)}
                                        alt="State After"
                                        className="max-h-[450px] w-full object-cover rounded-xl border border-[#e2e8f0] shadow-sm transition-transform hover:scale-[1.005]"
                                    />
                                </div>
                            )}

                            {data.result_image && (
                                <div className="mt-12 p-6 border-2 border-blue-100 bg-blue-50/50 rounded-2xl shadow-inner">
                                    <div className="mb-4 text-sm font-bold text-[#2563eb] flex items-center gap-2">
                                        <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                                        AI Analysis Result (Annotated)
                                    </div>
                                    <img
                                        src={getImageUrl(data.result_image.file_path)}
                                        alt="Analysis Result"
                                        className="w-full rounded-xl border-2 border-white shadow-xl"
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
