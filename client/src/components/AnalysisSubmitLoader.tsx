type AnalysisSubmitLoaderProps = {
  title?: string;
  subtitle?: string;
};

export function AnalysisSubmitLoader({
  title = "Analyzing construction changes",
  subtitle = "Running AI detection on your before/after imagery…",
}: AnalysisSubmitLoaderProps) {
  return (
    <div
      className="modal-overlay z-100"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="glass-card glass-card-elevated flex max-w-md flex-col items-center px-10 py-12">
        <div className="relative mb-8 flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-sky-200/60" />
          <div className="absolute inset-2 animate-[spin_4s_linear_infinite] rounded-full border border-dashed border-sky-300/50" />
          <div className="absolute inset-6 animate-[spin_6s_linear_infinite_reverse] rounded-full border border-emerald-300/40" />
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(37,99,235,0.2)_90deg,transparent_180deg)]" />
          <svg
            className="relative h-16 w-16 text-sky-500"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="28"
              y="8"
              width="8"
              height="44"
              rx="1"
              fill="currentColor"
              opacity="0.9"
            />
            <rect x="12" y="48" width="40" height="6" rx="1" fill="#94a3b8" />
            <path
              d="M36 12 L56 28 L52 32 L36 20 Z"
              fill="#10b981"
              className="origin-[36px_20px] animate-[crane-swing_2.4s_ease-in-out_infinite]"
            />
            <line
              x1="36"
              y1="20"
              x2="52"
              y2="30"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            <rect
              x="34"
              y="30"
              width="4"
              height="8"
              fill="#f59e0b"
              className="animate-[crane-load_2.4s_ease-in-out_infinite]"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-center text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">{subtitle}</p>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:300ms]" />
        </div>
      </div>
      <style>{`
        @keyframes crane-swing {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(12deg); }
        }
        @keyframes crane-load {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
}
