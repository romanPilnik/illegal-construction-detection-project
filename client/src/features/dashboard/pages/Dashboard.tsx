import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnalysesMeta } from "../api";
import { clearAuthStorage, getStoredUser } from "../../../lib/stored-user";
import { getApiErrorMessage } from "../../../lib/api-error";

function overviewRequestErrorMessage(reason: unknown): string {
  return getApiErrorMessage(reason, "Could not refresh totals.");
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user?.role === "Admin";

  const [totalAnalyses, setTotalAnalyses] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [countsError, setCountsError] = useState("");
  const [overviewLoading, setOverviewLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setCountsError("");
    setOverviewLoading(true);

    const [allRes, pendingRes] = await Promise.allSettled([
      getAnalysesMeta({}),
      getAnalysesMeta({ status: "Pending" }),
    ]);

    if (allRes.status === "fulfilled") {
      setTotalAnalyses(allRes.value.total);
    } else {
      setTotalAnalyses(null);
    }

    if (pendingRes.status === "fulfilled") {
      setPendingCount(pendingRes.value.total);
    } else {
      setPendingCount(null);
    }

    const metaFailures: string[] = [];
    if (allRes.status === "rejected") {
      metaFailures.push(overviewRequestErrorMessage(allRes.reason));
    }
    if (pendingRes.status === "rejected") {
      metaFailures.push(overviewRequestErrorMessage(pendingRes.reason));
    }
    setCountsError(metaFailures.filter(Boolean).join(" · "));

    setOverviewLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadOverview(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadOverview]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") void loadOverview();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [loadOverview]);

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-page">
      <nav className="glass-card sticky top-0 z-50 flex items-center justify-between px-8 py-3 text-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-base font-bold text-[#60a5fa]">
            C
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Construction Compliance
            </h2>
            <p className="-mt-px text-xs text-slate-400">
              Welcome{user?.username ? `, ${user.username}` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300"
          onClick={handleLogout}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </nav>

      <main className="mx-auto max-w-[1200px] p-10">
        <section>
          <h2 className="mb-5 mt-6 text-sm font-semibold uppercase tracking-[0.05em] text-slate-400">
            Quick Actions
          </h2>
          <div
            className="relative flex cursor-pointer items-center gap-6 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-8 py-6 text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition-transform duration-200 hover:-translate-y-0.5"
            onClick={() => navigate("/submit")}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15">
              <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM12 18l-3-3h2v-4h2v4h2l-3 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold">Upload New Analysis</h3>
              <p className="mt-[0.15rem] text-sm opacity-90">
                Submit before and after images for AI analysis
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-5 mt-6 text-sm font-semibold uppercase tracking-[0.05em] text-slate-400">
            Navigation
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
            <div
              className="glass-card flex cursor-pointer items-center gap-4 rounded-xl p-5 transition-all duration-200 hover:border-[#60a5fa] hover:bg-white/10"
              onClick={() => navigate("/analyses")}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#60a5fa]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h3 className="text-[0.9rem] font-semibold text-slate-100">
                  Analysis History
                </h3>
                <p className="mt-[0.15rem] text-xs text-slate-400">
                  View all submitted analyses and results
                </p>
              </div>
            </div>
            <div
              className="glass-card flex cursor-pointer items-center gap-4 rounded-xl p-5 transition-all duration-200 hover:border-[#60a5fa] hover:bg-white/10"
              onClick={() => navigate("/profile")}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#60a5fa]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 className="text-[0.9rem] font-semibold text-slate-100">
                  Profile
                </h3>
                <p className="mt-[0.15rem] text-xs text-slate-400">
                  Manage your account settings
                </p>
              </div>
            </div>
            {isAdmin && (
              <>
                <div
                  className="glass-card flex cursor-pointer items-center gap-4 rounded-xl p-5 transition-all duration-200 hover:border-[#60a5fa] hover:bg-white/10"
                  onClick={() => navigate("/users")}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#60a5fa]">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[0.9rem] font-semibold text-slate-100">
                      User Management
                    </h3>
                    <p className="mt-[0.15rem] text-xs text-slate-400">
                      Manage users and permissions
                    </p>
                  </div>
                </div>
                <div
                  className="glass-card flex cursor-pointer items-center gap-4 rounded-xl p-5 transition-all duration-200 hover:border-[#60a5fa] hover:bg-white/10"
                  onClick={() => navigate("/logs")}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#60a5fa]">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M16 13H8" />
                      <path d="M16 17H8" />
                      <path d="M10 9H8" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[0.9rem] font-semibold text-slate-100">
                      Audit logs
                    </h3>
                    <p className="mt-[0.15rem] text-xs text-slate-400">
                      Review system activity
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-5 mt-6 text-sm font-semibold uppercase tracking-[0.05em] text-slate-400">
            Overview
          </h2>
          {countsError && (
            <p className="mb-4 text-sm text-amber-200/90">
              Totals could not be refreshed: {countsError}
            </p>
          )}
          <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            <div className="glass-card rounded-xl p-6">
              <div className="text-[0.8rem] font-medium text-slate-400">
                Total Analyses
              </div>
              <div className="mt-2 text-4xl font-bold text-[#60a5fa]">
                {overviewLoading ? "…" : (totalAnalyses ?? "—")}
              </div>
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="text-[0.8rem] font-medium text-slate-400">
                Pending Results
              </div>
              <div className="mt-2 text-4xl font-bold text-[#f59e0b]">
                {overviewLoading ? "…" : (pendingCount ?? "—")}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
