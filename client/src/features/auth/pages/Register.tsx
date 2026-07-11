import React, { useState } from "react";
import { isAxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api";
import type { UserRole } from "../types";
import { PasswordInput } from "../../../components/PasswordInput";

const fieldClassName =
  "w-full rounded-lg border border-white/10 bg-[#0b1220] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 focus:border-[#10b981] focus:bg-[#0b1220] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]";

function messageFromAxios(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Array<{ field?: string; message?: string }> }
      | undefined;
    if (data?.errors?.length) {
      return data.errors.map((e) => e.message ?? e.field).join("; ");
    }
    return data?.message ?? fallback;
  }
  return fallback;
}

function RegisterForm() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Inspector");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await register({ username, email, password, role });

      if (data.userId) {
        navigate("/login", { replace: true, state: { registered: true } });
        return;
      }

      setError(data.message || "Registration failed");
    } catch (err: unknown) {
      setError(messageFromAxios(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#10b981] shadow-[0_4px_14px_rgba(16,185,129,0.35)]">
          <svg
            className="h-7 w-7 fill-white"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Register Account
        </h1>
        <p className="page-subtitle mt-1 text-sm">
          Create a new municipal profile
        </p>
      </div>

      <div className="glass-card w-full max-w-[420px] rounded-2xl p-8">
        {error && (
          <p className="mb-4 text-center text-[0.8rem] text-red-300">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Username
            </label>
            <input
              className={fieldClassName}
              type="text"
              placeholder="e.g. shirel_test"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email Address
            </label>
            <input
              className={fieldClassName}
              type="email"
              placeholder="admin@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              System Role
            </label>
            <select
              className={fieldClassName}
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="Inspector">Inspector</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="mb-5">
            <PasswordInput
              id="register-password"
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              required
              inputClassName={fieldClassName + " pr-11 focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]"}
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg border-none bg-[#10b981] py-3 text-[0.9rem] font-semibold text-white transition-colors duration-200 hover:enabled:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <Link
            className="mt-2 block w-full cursor-pointer border-none bg-transparent py-3 text-center text-sm text-slate-400 no-underline hover:text-slate-200"
            to="/login"
          >
            Already have an account? Sign In
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function Register() {
  // Public signup is enforced on the server (ALLOW_PUBLIC_REGISTRATION + NODE_ENV).
  // Keep the form here so production builds are not hard-blocked in the UI.
  return <RegisterForm />;
}
