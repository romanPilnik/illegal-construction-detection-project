import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
// ודאי שהוספת את הפונקציה הזו לקובץ ה-api.ts שלך
import { getAnalysisById, exportAnalysisById } from "../api";
import type { AnalysisDetailData } from "../types";

export default function AnalysisDetail() {
    const { analysisId } = useParams<{ analysisId: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState(null as AnalysisDetailData | null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const [exporting, setExporting] = useState(false);

    const getImageUrl = (path: string | undefined) => {
        if (!path) return "";
        const cleanPath = path.replace(/\\/g, "/");
        return `http://localhost:5001/${cleanPath}`;
    };

    const handleExport = async (format: 'PDF' | 'EXCEL') => {
        if (!data?.id) return;
        setExporting(true);
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
            alert("הייצוא נכשל. ודאי שהשרת פועל ותיקיית הדיווחים מוגדרת.");
        } finally {
            setExporting(false);
        }
    };

    const getAnomalyBadge = (status: string, hasAnomaly: boolean | null) => {
        const baseClasses = "px-3 py-1 rounded-full text-xs font-bold shadow-sm border";

        if (status === 'Pending' || status === 'Processing') {
            return {
                classes: `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-300`,
                text: "Processing"
            };
        }

        if (hasAnomaly) {
            return {
                classes: `${baseClasses} bg-red-100 text-red-700 border-red-200`,
                text: "נמצאה חולשה"
            };
        }

        return {
            classes: `${baseClasses} bg-green-100 text-green-700 border-green-200`,
            text: "תקין (לא נמצאה חולשה)"
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
                    if (isAxiosError(err)) {
                        const data = err.response?.data as { message?: string } | undefined;
                        setError(data?.message ?? "Could not load analysis");
                    } else {
                        setError("Could not load analysis");
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [analysisId]);

    return (
        <div className="min-h-screen bg-[#f0f4f8] pt-8 [font-:'Segoe_UI',system-ui,sans-serif]">
            {/* Header Bar */}
            <div className="mx-auto flex max-w-[900px] items-center justify-between border-b border-t border-[#e2e8f0] bg-white px-8 py-4 shadow-sm">
                <button
                    type="button"
                    className="cursor-pointer border-none bg-transparent text-sm font-semibold text-[#64748b] hover:text-[#2563eb] transition-colors"
                    onClick={() => navigate("/analyses")}
                >
                    ← Back to list
                </button>

                {/* Export Actions */}
                {!loading && !error && data && (
                    <div className="flex gap-3">
                        <button
                            disabled={exporting}
                            onClick={() => handleExport('PDF')}
                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-all active:scale-95"
                        >
                            {exporting ? 'Generating...' : '📄 PDF Report'}
                        </button>
                        <button
                            disabled={exporting}
                            onClick={() => handleExport('EXCEL')}
                            className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg text-xs font-bold hover:bg-green-100 disabled:opacity-50 transition-all active:scale-95"
                        >
                            {exporting ? 'Generating...' : '📊 Excel Sheet'}
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="mx-auto my-8 max-w-[900px] rounded-xl border border-[#e2e8f0] bg-white px-8 py-6 shadow-sm">
                {loading && <p className="p-8 text-center text-[#64748b] animate-pulse">Loading analysis data...</p>}
                {!loading && error && <p className="text-[#b91c1c] p-4 bg-red-50 rounded-lg border border-red-100">{error}</p>}

                {!loading && !error && data && (
                    <>
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8 pb-6 border-b border-[#f1f5f9]">
                            <div>
                                <div className="mb-2 text-[0.85rem] font-bold uppercase tracking-wider text-[#94a3b8]">General Info</div>
                                <div className="mb-1 text-[0.9rem] text-[#334155]"><span className="font-semibold text-[#64748b] mr-2">ID:</span>{data.id}</div>
                                <div className="mb-1 text-[0.9rem] text-[#334155]"><span className="font-semibold text-[#64748b] mr-2">Status:</span>{data.status}</div>
                            </div>
                            <div>
                                <div className="mb-2 text-[0.85rem] font-bold uppercase tracking-wider text-[#94a3b8]">History</div>
                                <div className="mb-1 text-[0.9rem] text-[#334155]"><span className="font-semibold text-[#64748b] mr-2">Created:</span>{new Date(data.created_at).toLocaleString()}</div>
                                <div className="mb-1 text-[0.9rem] text-[#334155]"><span className="font-semibold text-[#64748b] mr-2">Inspector:</span>{data.issued_by?.username || 'System'}</div>
                            </div>
                        </div>

                        {/* Anomaly Badge */}
                        <div className="mb-6 p-4 bg-[#f8fafc] rounded-lg border border-[#f1f5f9] flex items-center">
                            <span className="mr-3 font-bold text-[#1e293b]">Analysis Status:</span>

                            {(() => {
                                const badge = getAnomalyBadge(data.status, data.anomaly_detected);
                                return (
                                    <span className={badge.classes}>
                                    {badge.text}
                                </span>
                                );
                            })()}
                        </div>

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