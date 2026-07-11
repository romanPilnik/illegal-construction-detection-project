import { useState, useRef, useEffect } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { createAnalysis } from "../api";

function submitErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: string; message?: string }
      | undefined;
    return data?.error ?? data?.message ?? "Failed to submit analysis";
  }
  return "Failed to submit analysis";
}

export default function SubmitAnalysis() {
  const navigate = useNavigate();
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [quickView, setQuickView] = useState<"before" | "after" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!beforeImage) {
      setBeforePreview(null);
      return;
    }
    const url = URL.createObjectURL(beforeImage);
    setBeforePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [beforeImage]);

  useEffect(() => {
    if (!afterImage) {
      setAfterPreview(null);
      return;
    }
    const url = URL.createObjectURL(afterImage);
    setAfterPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [afterImage]);

  useEffect(() => {
    if (!quickView) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuickView(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quickView]);

  const handleSubmit = async () => {
    if (!beforeImage || !afterImage) return;
    setSubmitting(true);
    setError("");
    const formData = new FormData();
    formData.append("beforeImage", beforeImage);
    formData.append("afterImage", afterImage);
    try {
      const res = await createAnalysis(formData);
      navigate(`/analyses/${res.analysisId}`, { replace: true });
    } catch (err) {
      setError(submitErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(beforeImage && afterImage) && !submitting;

  const dropCardClass =
    "group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-blue-200 bg-blue-50 transition-[border-color,background-color] hover:border-blue-300 hover:bg-blue-100/80";

  const footerStripClass =
    "w-full border-t border-blue-200 bg-blue-100 px-4 py-3 text-center text-sm font-semibold text-blue-700 transition-colors group-hover:bg-blue-200/70";

  const dropZoneInnerClass =
    "flex min-h-[240px] flex-col items-center justify-center bg-blue-50 px-4 py-6";

  return (
    <div className="app-page pt-8">
      <div className="mx-auto mb-8 max-w-[1000px]">
        <h1 className="page-title mb-6 text-[2rem] font-bold">
          Image Submission
        </h1>
      </div>

      <div className="glass-card flex items-center gap-8 px-8 py-4">
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 border-none bg-transparent text-sm font-semibold text-slate-300 hover:text-slate-100"
          onClick={() => navigate("/")}
        >
          ← Back to Dashboard
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Submit Analysis</h2>
          <p className="text-xs text-slate-400">
            Upload before and after images
          </p>
        </div>
      </div>

      <div className="glass-card mx-auto max-w-[1000px] rounded-xl p-8">
        <div className="mb-8 grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <div className="font-semibold text-slate-100">Before Image</div>
            <label htmlFor="submit-before-file" className={dropCardClass}>
              <div className={dropZoneInnerClass}>
                {beforePreview ? (
                  <img
                    src={beforePreview}
                    alt=""
                    className="max-h-44 max-w-full rounded-lg border border-blue-200 object-contain shadow-sm"
                  />
                ) : (
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-200 text-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.12)]">
                    ↑
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-700">
                  {beforeImage ? beforeImage.name : "No image uploaded"}
                </p>
                <span className="mt-1 text-center text-xs text-slate-500">
                  Upload the initial state image
                </span>
              </div>
              <span className={footerStripClass}>Browse or click here to upload</span>
              <input
                id="submit-before-file"
                type="file"
                className="sr-only"
                ref={beforeInputRef}
                onChange={(e) => setBeforeImage(e.target.files?.[0] || null)}
                accept="image/*"
              />
            </label>
            {beforePreview && (
              <button
                type="button"
                className="self-start rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
                onClick={() => setQuickView("before")}
              >
                Quick view
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="font-semibold text-slate-100">After Image</div>
            <label htmlFor="submit-after-file" className={dropCardClass}>
              <div className={dropZoneInnerClass}>
                {afterPreview ? (
                  <img
                    src={afterPreview}
                    alt=""
                    className="max-h-44 max-w-full rounded-lg border border-blue-200 object-contain shadow-sm"
                  />
                ) : (
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-200 text-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.12)]">
                    ↑
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-700">
                  {afterImage ? afterImage.name : "No image uploaded"}
                </p>
                <span className="mt-1 text-center text-xs text-slate-500">
                  Upload the current state image
                </span>
              </div>
              <span className={footerStripClass}>Browse or click here to upload</span>
              <input
                id="submit-after-file"
                type="file"
                className="sr-only"
                ref={afterInputRef}
                onChange={(e) => setAfterImage(e.target.files?.[0] || null)}
                accept="image/*"
              />
            </label>
            {afterPreview && (
              <button
                type="button"
                className="self-start rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
                onClick={() => setQuickView("after")}
              >
                Quick view
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          className={`w-full rounded-lg border-none p-4 font-semibold text-white transition-[background-color,transform] duration-200 ${
            canSubmit
              ? "cursor-pointer bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.99]"
              : "cursor-not-allowed bg-slate-600/50 text-slate-400"
          }`}
          disabled={!beforeImage || !afterImage || submitting}
          onClick={() => void handleSubmit()}
        >
          {submitting ? "Submitting…" : "Submit for Analysis"}
        </button>
      </div>

      {quickView && (
        <div
          role="presentation"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setQuickView(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            className="relative max-h-[90vh] max-w-[min(92vw,900px)] rounded-xl border border-white/10 bg-[#0f172a] p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 z-10 rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs font-semibold text-slate-100 hover:bg-white/20"
              onClick={() => setQuickView(null)}
            >
              Close
            </button>
            <img
              src={quickView === "before" ? beforePreview ?? "" : afterPreview ?? ""}
              alt={quickView === "before" ? "Before upload preview" : "After upload preview"}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
