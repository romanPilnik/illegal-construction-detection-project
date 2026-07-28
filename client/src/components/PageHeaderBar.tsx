import type { ReactNode } from "react";

type PageHeaderBarProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onBack: () => void;
  backLabel?: string;
};

export function PageHeaderBar({
  title,
  subtitle,
  icon,
  onBack,
  backLabel = "Back to Dashboard",
}: PageHeaderBarProps) {
  return (
    <div className="glass-card mx-auto mb-6 flex max-w-[1100px] items-center justify-between gap-5 rounded-xl px-6 py-4">
      <button
        type="button"
        onClick={onBack}
        className="group flex shrink-0 items-center gap-2 rounded-lg border border-slate-200/80 bg-white/70 px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 active:scale-[0.98]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </button>

      <div className="flex min-w-0 items-center gap-4">
        <div className="min-w-0 text-right">
          <h2 className="truncate text-lg font-bold tracking-tight text-slate-100">
            {title}
          </h2>
          <p className="truncate text-sm text-slate-400">{subtitle}</p>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-blue-100/80 text-[#2563eb] shadow-sm"
          aria-hidden
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
