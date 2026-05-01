import React, { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api";
import { markSessionActivity } from "../../../lib/stored-user";

const inputClassName =
  "w-full rounded-lg border border-white/10 bg-[#0b1220] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-slate-500 focus:border-[#60a5fa] focus:bg-[#0b1220] focus:shadow-[0_0_0_3px_rgba(96,165,250,0.15)]";

function messageFromAxios(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}

const IDLE_LOGOUT_KEY = "idleLogoutPrompt";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/";
  const registered = Boolean(
    (location.state as { registered?: boolean } | null)?.registered,
  );
  const [showSessionExpired, setShowSessionExpired] = useState(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem(IDLE_LOGOUT_KEY) === "1",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showSessionExpired) return;
    const timeoutId = window.setTimeout(() => {
      setShowSessionExpired(false);
      sessionStorage.removeItem(IDLE_LOGOUT_KEY);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [showSessionExpired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login({ email, password });

      if (data.token) {
        localStorage.setItem("token", data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        markSessionActivity();
        sessionStorage.removeItem(IDLE_LOGOUT_KEY);
        navigate(from, { replace: true });
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err: unknown) {
      setError(messageFromAxios(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2563eb] shadow-[0_4px_14px_rgba(37,99,235,0.35)]">
          <svg
            className="h-7 w-7 fill-white"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 18v-1h8v1H8zm0-3v-1h8v1H8zm0-3V11h5v1H8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Construction Compliance
        </h1>
        <p className="page-subtitle mt-1 text-sm">
          Municipal Inspection Portal
        </p>
      </div>

      <div className="glass-card w-full max-w-[420px] rounded-2xl p-8">
        {registered && (
          <p className="mb-4 text-center text-[0.8rem] text-emerald-300">
            Account created. Sign in with your email and password.
          </p>
        )}
        {showSessionExpired && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[0.8rem] text-amber-200">
            <p className="m-0 text-left">
              Session expired after 1 hour of inactivity. Please sign in again.
            </p>
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-0 text-[0.9rem] leading-none text-amber-200"
              onClick={() => {
                sessionStorage.removeItem(IDLE_LOGOUT_KEY);
                setShowSessionExpired(false);
              }}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}
        {error && (
          <p className="mb-4 text-center text-[0.8rem] text-red-300">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              className={inputClassName}
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              className={inputClassName}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-lg border-none bg-[#2563eb] py-3 text-[0.9rem] font-semibold text-white transition-[background-color,transform] duration-200 hover:enabled:bg-[#1d4ed8] active:enabled:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          {import.meta.env.DEV && (
            <Link
              className="mt-3 box-border block w-full rounded-lg border border-white/15 bg-white/5 py-3 text-center text-[0.9rem] font-semibold text-slate-200 no-underline transition-all duration-200 hover:border-[#94a3b8] hover:bg-white/10 active:scale-[0.99]"
              to="/register"
            >
              Sign Up
            </Link>
          )}
          <p className="mt-4 text-center text-[0.8rem] text-slate-400">
            Authorized personnel only
          </p>
        </form>
      </div>

      <p className="mt-8 text-xs text-slate-500">
        © 2026 Municipal Construction Compliance System
      </p>
    </div>
  );
}
