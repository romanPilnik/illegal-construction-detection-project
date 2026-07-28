import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createAnalysis } from "../api";
import { AnalysisSubmitLoader } from "../../../components/AnalysisSubmitLoader";
import { getApiErrorMessage } from "../../../lib/api-error";
import { PageHeaderBar } from "../../../components/PageHeaderBar";

function submitErrorMessage(err: unknown): string {
  return getApiErrorMessage(err, "Failed to submit analysis.");
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
  const [requestTitle, setRequestTitle] = useState("");

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
    const title = requestTitle.trim();
    if (!title) {
      setError("Please enter a request title.");
      return;
    }
    setSubmitting(true);
    setError("");
    const formData = new FormData();
    formData.append("beforeImage", beforeImage);
    formData.append("afterImage", afterImage);
    formData.append("request_title", title);
    try {
      const res = await createAnalysis(formData);
      navigate(`/analyses/${res.data.id}`, { replace: true });
    } catch (err) {
      setError(submitErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(beforeImage && afterImage) && !submitting;

  const missingTitle = Boolean(
    beforeImage && afterImage && !requestTitle.trim(),
  );

  return (
    <div className="app-page pt-8">
      <div className="mx-auto mb-8 max-w-275">
        <h1 className="page-title mb-6 text-[2rem] font-bold">
          Image Submission
        </h1>
      </div>

      <PageHeaderBar
        title="Submit Analysis"
        subtitle="Upload before and after images"
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        }
      />

      <div className="glass-card glass-card-elevated mx-auto my-6 max-w-275 p-8">
        <div className="mb-8">
          <label htmlFor="request-title" className="form-label">
            Request Title
          </label>
          <input
            id="request-title"
            type="text"
            maxLength={120}
            placeholder="e.g. Main Street building inspection — March 2026"
            value={requestTitle}
            onChange={(e) => setRequestTitle(e.target.value)}
            className="form-input"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Give this analysis a name so you can find it easily in your history.
          </p>
          {missingTitle && (
            <p className="mt-1.5 text-xs font-medium text-amber-600">
              Enter a request title to enable submission.
            </p>
          )}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <div className="form-label mb-0">Before Image</div>
            <label htmlFor="submit-before-file" className="drop-zone">
              <div className="drop-zone-inner">
                {beforePreview ? (
                  <img
                    src={beforePreview}
                    alt=""
                    className="max-h-44 max-w-full rounded-lg border border-blue-200 object-contain shadow-md"
                  />
                ) : (
                  <div className="drop-zone-icon">↑</div>
                )}
                <p className="text-sm font-semibold text-slate-700">
                  {beforeImage ? beforeImage.name : "No image uploaded"}
                </p>
                <span className="mt-1 text-center text-xs text-slate-500">
                  Upload the initial state image
                </span>
              </div>
              <span className="drop-zone-footer">
                Browse or click here to upload
              </span>
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
                className="btn btn-ghost self-start text-xs"
                onClick={() => setQuickView("before")}
              >
                Quick view
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="form-label mb-0">After Image</div>
            <label htmlFor="submit-after-file" className="drop-zone">
              <div className="drop-zone-inner">
                {afterPreview ? (
                  <img
                    src={afterPreview}
                    alt=""
                    className="max-h-44 max-w-full rounded-lg border border-blue-200 object-contain shadow-md"
                  />
                ) : (
                  <div className="drop-zone-icon">↑</div>
                )}
                <p className="text-sm font-semibold text-slate-700">
                  {afterImage ? afterImage.name : "No image uploaded"}
                </p>
                <span className="mt-1 text-center text-xs text-slate-500">
                  Upload the current state image
                </span>
              </div>
              <span className="drop-zone-footer">
                Browse or click here to upload
              </span>
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
                className="btn btn-ghost self-start text-xs"
                onClick={() => setQuickView("after")}
              >
                Quick view
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <button
          type="button"
          className={`btn btn-primary w-full p-4 text-base ${
            !canSubmit || !requestTitle.trim() ? "opacity-50" : ""
          } ${canSubmit && !requestTitle.trim() ? "bg-amber-600! hover:bg-amber-700!" : ""}`}
          disabled={!canSubmit}
          onClick={() => void handleSubmit()}
        >
          {submitting ? "Submitting…" : "Submit for Analysis"}
        </button>
      </div>

      {submitting && <AnalysisSubmitLoader />}

      {quickView && (
        <div
          role="presentation"
          tabIndex={-1}
          className="modal-overlay"
          onClick={() => setQuickView(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            className="modal-panel modal-panel-lg p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-secondary absolute right-3 top-3 z-10 text-xs"
              onClick={() => setQuickView(null)}
            >
              Close
            </button>
            <img
              src={
                quickView === "before"
                  ? (beforePreview ?? "")
                  : (afterPreview ?? "")
              }
              alt={
                quickView === "before"
                  ? "Before upload preview"
                  : "After upload preview"
              }
              className="max-h-[80vh] w-full rounded-lg object-contain shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
