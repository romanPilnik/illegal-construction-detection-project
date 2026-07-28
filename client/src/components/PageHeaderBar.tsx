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
    <div className="glass-card glass-card-elevated mx-auto mb-6 flex max-w-275 items-center justify-between gap-5 px-6 py-4">
      <button
        type="button"
        onClick={onBack}
        className="btn btn-secondary group shrink-0"
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
          <h2 className="truncate text-lg font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="truncate text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="icon-badge icon-badge--lg shrink-0" aria-hidden>
          {icon}
        </div>
      </div>
    </div>
  );
}
