import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAnalyses, exportAnalysesByDate } from "../api";
import type { AnalysisListRow, AnalysisStatus } from "../types";
import { getApiErrorMessage } from "../../../lib/api-error";
import { PageHeaderBar } from "../../../components/PageHeaderBar";
import { downloadExportFile } from "../download-export";

type StatusType = AnalysisStatus | "";

function statusBadgeClasses(status: AnalysisStatus) {
  const key = status.toLowerCase();
  const base = "rounded-full px-3 py-1 text-xs font-semibold";
  if (key === "completed") return `${base} bg-[#dcfce3] text-[#166534]`;
  if (key === "pending") return `${base} bg-[#fef3c7] text-[#92400e]`;
  if (key === "failed") return `${base} bg-[#fee2e2] text-[#991b1b]`;
  return base;
}

/** Empty while waiting on AI (pending). */
function aiResultLabel(
  status: AnalysisStatus,
  anomalyDetected: boolean | null,
): string {
  const key = status.toLowerCase();
  if (key === "pending" || key === "processing") return "";
  if (key !== "completed") return "";
  if (anomalyDetected === true) return "Vulnerability found";
  if (anomalyDetected === false) return "Normal";
  return "";
}

function aiResultCellClass(label: string) {
  if (!label) return "text-sm text-slate-600";
  if (label === "Vulnerability found")
    return "text-sm font-medium text-rose-300";
  return "text-sm font-medium text-emerald-300";
}

const ROW_GRID =
  "grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)_minmax(0,1fr)_5rem] items-center gap-x-4 gap-y-1 px-6 py-3.5";

export default function AnalysisHistory() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([] as AnalysisListRow[]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"PDF" | "EXCEL" | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<StatusType>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const today = new Date().toISOString().split("T")[0];

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
        end_date: endDate || undefined,
      });
      setAnalyses(payload.data ?? []);
    } catch (err) {
      console.warn("Could not fetch analyses:", err);
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, startDate, endDate]);

  useEffect(() => {
    void fetchData();
    // Filters are applied explicitly with the Search button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (err) {
      console.warn("Could not reset analyses:", err);
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExport = async (format: "PDF" | "EXCEL") => {
    setExporting(format);
    try {
      const res = await exportAnalysesByDate({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        format,
      });
      await downloadExportFile(
        res.downloadUrl,
        format,
        `Bulk_Report_${Date.now()}`,
      );
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to export analyses."));
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
    <div className="app-page pt-8">
      <div className="mx-auto mb-8 max-w-275">
        <h1 className="page-title mb-6 text-[2rem] font-bold">
          Analysis History
        </h1>
      </div>

      <PageHeaderBar
        title="Record Management"
        subtitle="Search and manage historical analysis results"
        onBack={() => navigate("/")}
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        }
      />

      {/* Filter & Search Bar */}
      <div className="glass-card mx-auto my-6 max-w-275 p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="form-label-sm">From</label>
            <input
              type="date"
              max={today}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input w-auto"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label-sm">To</label>
            <input
              type="date"
              max={today}
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input w-auto"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label-sm">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusType)}
              className="form-input w-auto cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <button onClick={fetchData} className="btn btn-accent">
            🔍 Search
          </button>
          <button
            onClick={handleReset}
            disabled={!hasActiveFilters || loading}
            className="btn btn-secondary"
          >
            ✖ Reset
          </button>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              disabled={exporting !== null}
              onClick={() => handleBulkExport("PDF")}
              className="btn btn-ghost min-w-35 text-xs"
            >
              {exporting === "PDF" ? "Generating…" : "📄 Export PDF"}
            </button>
            <button
              type="button"
              disabled={exporting !== null}
              onClick={() => handleBulkExport("EXCEL")}
              className="btn btn-ghost min-w-35 text-xs"
            >
              {exporting === "EXCEL" ? "Generating…" : "📊 Export Excel"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mx-auto mb-6 max-w-275">
          ⚠️ {error}
        </div>
      )}

      <div className="mx-auto my-8 max-w-275">
        {loading ? (
          <p className="animate-pulse py-20 text-center text-slate-400">
            Fetching records...
          </p>
        ) : analyses.length === 0 ? (
          <div className="glass-card rounded-xl border border-dashed border-white/20 py-20 text-center">
            <p className="text-slate-400">
              No records found for the selected criteria.
            </p>
          </div>
        ) : (
          <div className="glass-card glass-card-elevated overflow-hidden">
            <div
              className={`${ROW_GRID} border-b border-slate-200/60 bg-slate-50/80 text-left`}
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
                    className={`${ROW_GRID} table-row-interactive group text-left`}
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
                    <div className={`min-h-5 ${aiResultCellClass(resultText)}`}>
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
