import React, { useState } from 'react';

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  inputClassName?: string;
};

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <path d="M3 3l18 18M10.58 10.58a2 2 0 0 0 2.84 2.84M9.88 5.09A10.94 10.94 0 0 1 12 5c5.52 0 10 4.48 10 7a11.8 11.8 0 0 1-2.05 2.85M6.12 6.12A11.76 11.76 0 0 0 2 12c0 2.52 4.48 7 10 7 1.05 0 2.06-.16 3-.45" />
      </svg>
    );
  }

  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M2 12s4.48-7 10-7 10 7 10 7-4.48 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
  inputClassName = 'w-full rounded-lg border border-white/10 bg-[#0b1220] px-3.5 py-2.5 pr-11 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-[#60a5fa] focus:bg-[#0b1220] focus:shadow-[0_0_0_3px_rgba(96,165,250,0.15)]',
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={inputClassName}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center border-none bg-transparent text-slate-400 transition-colors hover:text-slate-200"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <EyeIcon hidden={visible} />
        </button>
      </div>
    </div>
  );
}
