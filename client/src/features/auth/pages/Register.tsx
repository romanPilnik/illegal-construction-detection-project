import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api";
import type { UserRole } from "../types";
import { PasswordInput } from "../../../components/PasswordInput";
import {
  isPasswordLongEnough,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_PLACEHOLDER,
} from "../../../lib/password-rules";
import { getApiErrorMessage } from "../../../lib/api-error";

const fieldClassName = "form-input";

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

    if (!isPasswordLongEnough(password)) {
      setError(PASSWORD_MIN_LENGTH_MESSAGE);
      setLoading(false);
      return;
    }

    try {
      const data = await register({ username, email, password, role });

      if (data.userId) {
        navigate("/login", { replace: true, state: { registered: true } });
        return;
      }

      setError(data.message || "Registration failed");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Registration failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="auth-logo auth-logo--green mb-4">
          <svg
            className="h-7 w-7 fill-white"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Register Account
        </h1>
        <p className="page-subtitle mt-1 text-sm">
          Create a new municipal profile
        </p>
      </div>

      <div className="glass-card auth-card auth-card--green glass-card-elevated">
        {error && (
          <p className="alert alert-error mb-4 text-center text-[0.8rem]">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="form-label">Username</label>
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
            <label className="form-label">Email Address</label>
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
            <label className="form-label">System Role</label>
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
              placeholder={PASSWORD_PLACEHOLDER}
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              inputClassName={fieldClassName}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-2 w-full py-3 text-[0.9rem] bg-emerald-600! hover:bg-emerald-700!"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <Link
            className="mt-2 block w-full py-3 text-center text-sm text-slate-500 no-underline hover:text-slate-700"
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
