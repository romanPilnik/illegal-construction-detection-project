import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUDIT_LOGS_PAGE_LIMIT, getAuditLogs } from "../api";
import type { AuditLogRow, AuditLogsListMeta } from "../types";
import { getApiErrorMessage } from "../../../lib/api-error";
import { PageHeaderBar } from "../../../components/PageHeaderBar";

export default function AuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([] as AuditLogRow[]);
  const [meta, setMeta] = useState<AuditLogsListMeta | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionInput, setActionInput] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      const trimmed = actionInput.trim();
      setActionFilter((prev) => {
        if (prev === trimmed) return prev;
        setPage(1);
        return trimmed;
      });
    }, 300);
    return () => window.clearTimeout(t);
  }, [actionInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await getAuditLogs({
          page,
          limit: AUDIT_LOGS_PAGE_LIMIT,
          action: actionFilter.trim() || undefined,
        });
        if (!cancelled) {
          setLogs(payload.data ?? []);
          setMeta(payload.meta);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Failed to load audit logs."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, actionFilter]);

  const totalPages = meta?.totalPages ?? 0;
  const canPrev = page > 1;
  const canNext = meta?.hasNextPage ?? false;

  return (
    <div className="app-page pt-8">
      <div className="mx-auto mb-4 max-w-275 px-4">
        <h1 className="page-title text-[2rem] font-bold">Audit logs</h1>
      </div>
      <PageHeaderBar
        title="Audit Logs"
        subtitle="Track user actions and system events"
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        }
      />
      <div className="glass-card mx-auto mt-6 max-w-275 px-6 py-5">
        <label className="form-label" htmlFor="audit-action-filter">
          Filter by action
        </label>
        <p className="mb-2 text-xs text-slate-500">
          Matches entries whose action contains this text.
        </p>
        <input
          id="audit-action-filter"
          type="search"
          value={actionInput}
          onChange={(e) => setActionInput(e.target.value)}
          placeholder="e.g. login, update"
          className="form-input max-w-md"
        />
      </div>
      {error && (
        <p className="alert alert-error mx-auto my-4 max-w-275 px-4">{error}</p>
      )}
      <div className="glass-card glass-card-elevated mx-auto my-8 max-w-275 overflow-auto">
        {loading && logs.length === 0 ? (
          <p className="px-8 py-8 text-center text-slate-500">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="px-8 py-8 text-center text-slate-500">
            No log entries.
          </p>
        ) : (
          <>
            {loading && (
              <p className="border-b border-slate-200/60 bg-slate-50/80 px-4 py-2 text-center text-xs text-slate-500">
                Updating…
              </p>
            )}
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="table-head">Time</th>
                  <th className="table-head">User</th>
                  <th className="table-head">IP address</th>
                  <th className="table-head">Action</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-sky-50/50"
                  >
                    <td className="table-cell">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="table-cell">{log.user?.username ?? "—"}</td>
                    <td className="table-cell">{log.ip_address || "—"}</td>
                    <td className="table-cell">{log.action}</td>
                    <td className="table-cell">{log.status}</td>
                    <td className="table-cell">{log.details ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {meta && totalPages > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 px-4 py-3 text-sm text-slate-600">
                <span>
                  Page {meta.page} of {totalPages}
                  {meta.total > 0 ? (
                    <span className="text-slate-500">
                      {" "}
                      ({meta.total} {meta.total === 1 ? "entry" : "entries"})
                    </span>
                  ) : null}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={!canPrev || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={!canNext || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
