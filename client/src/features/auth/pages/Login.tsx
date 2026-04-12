import React, { useState } from "react";
import { isAxiosError } from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api";

const inputClassName =
  "w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5 text-sm text-[#1e293b] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]";

function messageFromAxios(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/";
  const registered = Boolean(
    (location.state as { registered?: boolean } | null)?.registered,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(135deg,#e8edf5_0%,#f0f4fb_50%,#e4eaf4_100%)] [font-:'Segoe_UI',system-ui,sans-serif]">
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
        <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">
          Construction Compliance
        </h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Municipal Inspection Portal
        </p>
      </div>

      <div className="w-full max-w-[380px] rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        {registered && (
          <p className="mb-4 text-center text-[0.8rem] text-[#166534]">
            Account created. Sign in with your email and password.
          </p>
        )}
        {error && (
          <p className="mb-4 text-center text-[0.8rem] text-[#ef4444]">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-[#374151]">
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
            <label className="mb-2 block text-sm font-medium text-[#374151]">
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
              className="mt-3 box-border block w-full rounded-lg border border-[#cbd5e1] bg-[#f1f5f9] py-3 text-center text-[0.9rem] font-semibold text-[#334155] no-underline transition-all duration-200 hover:border-[#94a3b8] hover:bg-[#e2e8f0] active:scale-[0.99]"
              to="/register"
            >
              Sign Up
            </Link>
          )}
          <p className="mt-4 text-center text-[0.8rem] text-[#94a3b8]">
            Authorized personnel only
          </p>
        </form>
      </div>

      <p className="mt-8 text-xs text-[#94a3b8]">
        © 2026 Municipal Construction Compliance System
      </p>
    </div>
  );
}
