import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { getAnalysisById } from "../api";
import type { AnalysisDetailData } from "../types";

export default function AnalysisDetail() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState(null as AnalysisDetailData | null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
      <div className="mx-auto flex max-w-[900px] items-center gap-8 border-b border-t border-[#e2e8f0] bg-white px-8 py-4">
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent text-sm font-semibold text-[#64748b] hover:text-[#2563eb]"
          onClick={() => navigate("/analyses")}
        >
          ← Back to list
        </button>
      </div>
      <div className="mx-auto my-8 max-w-[900px] rounded-xl border border-[#e2e8f0] bg-white px-8 py-6">
        {loading && <p className="p-8 text-center text-[#64748b]">Loading…</p>}
        {!loading && error && <p className="text-[#b91c1c]">{error}</p>}
        {!loading && !error && data && (
          <>
            <div className="mb-3 text-[0.9rem] text-[#334155]">
              <span className="mr-2 font-semibold text-[#64748b]">ID</span>
              {data.id}
            </div>
            <div className="mb-3 text-[0.9rem] text-[#334155]">
              <span className="mr-2 font-semibold text-[#64748b]">Status</span>
              {data.status}
            </div>
            <div className="mb-3 text-[0.9rem] text-[#334155]">
              <span className="mr-2 font-semibold text-[#64748b]">Created</span>
              {new Date(data.created_at).toLocaleString()}
            </div>
            <div className="mb-3 text-[0.9rem] text-[#334155]">
              <span className="mr-2 font-semibold text-[#64748b]">
                Anomaly detected
              </span>
              {data.anomaly_detected === null
                ? "—"
                : String(data.anomaly_detected)}
            </div>
            {data.issued_by && (
              <div className="mb-3 text-[0.9rem] text-[#334155]">
                <span className="mr-2 font-semibold text-[#64748b]">
                  Issued by
                </span>
                {data.issued_by.username}
              </div>
            )}
            {data.before_image && (
              <div className="mb-3 text-[0.9rem] text-[#334155]">
                <span className="mr-2 font-semibold text-[#64748b]">
                  Before
                </span>
                {data.before_image.file_path}
              </div>
            )}
            {data.after_image && (
              <div className="mb-3 text-[0.9rem] text-[#334155]">
                <span className="mr-2 font-semibold text-[#64748b]">After</span>
                {data.after_image.file_path}
              </div>
            )}
            {data.result_image && (
              <div className="mb-3 text-[0.9rem] text-[#334155]">
                <span className="mr-2 font-semibold text-[#64748b]">
                  Result
                </span>
                {data.result_image.file_path}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
