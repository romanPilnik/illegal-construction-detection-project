import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { AUDIT_LOGS_PAGE_LIMIT, getAuditLogs } from "../api";
import type { AuditLogRow, AuditLogsListMeta } from "../types";

const cell = "border-b border-[#e2e8f0] px-4 py-3 text-left";
const head = `${cell} bg-[#f8fafc] font-semibold text-[#475569]`;

const btnNav =
  "cursor-pointer rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-sm font-medium text-[#334155] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50";

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
          if (isAxiosError(err)) {
            const data = err.response?.data as { message?: string } | undefined;
            setError(data?.message ?? "Failed to load logs");
          } else {
            setError("Failed to load logs");
          }
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
    <div className="min-h-screen bg-[#f0f4f8] pt-8 [font-:'Segoe_UI',system-ui,sans-serif]">
      <div className="mx-auto mb-4 max-w-[1100px] px-4">
        <h1 className="text-[2rem] font-bold text-[#1e293b]">Audit logs</h1>
      </div>
      <div className="flex items-center gap-8 border-b border-t border-[#e2e8f0] bg-white px-8 py-4">
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent text-sm font-semibold text-[#64748b] hover:text-[#2563eb]"
          onClick={() => navigate("/")}
        >
          ← Back to Dashboard
        </button>
      </div>
      <div className="mx-auto mt-6 max-w-[1100px] px-4">
        <label
          className="block text-sm font-medium text-[#475569]"
          htmlFor="audit-action-filter"
        >
          Filter by action
        </label>
        <p className="mt-0.5 text-xs text-[#64748b]">
          Matches entries whose action contains this text.
        </p>
        <input
          id="audit-action-filter"
          type="search"
          value={actionInput}
          onChange={(e) => setActionInput(e.target.value)}
          placeholder="e.g. login, update"
          className="mt-2 w-full max-w-md rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm text-[#1e293b] outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
        />
      </div>
      {error && (
        <p className="mx-auto my-4 max-w-[1100px] px-4 text-[#b91c1c]">
          {error}
        </p>
      )}
      <div className="mx-auto my-8 max-w-[1100px] overflow-auto rounded-xl border border-[#e2e8f0] bg-white">
        {loading && logs.length === 0 ? (
          <p className="px-8 py-8 text-center text-[#64748b]">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="px-8 py-8 text-center text-[#64748b]">
            No log entries.
          </p>
        ) : (
          <>
            {loading && (
              <p className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-center text-xs text-[#64748b]">
                Updating…
              </p>
            )}
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
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className={cell}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className={cell}>{log.user?.username ?? "—"}</td>
                    <td className={cell}>{log.action}</td>
                    <td className={cell}>{log.status}</td>
                    <td className={cell}>{log.details ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {meta && totalPages > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] px-4 py-3 text-sm text-[#475569]">
                <span>
                  Page {meta.page} of {totalPages}
                  {meta.total > 0 ? (
                    <span className="text-[#64748b]">
                      {" "}
                      ({meta.total} {meta.total === 1 ? "entry" : "entries"})
                    </span>
                  ) : null}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={btnNav}
                    disabled={!canPrev || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className={btnNav}
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
