import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api';
import { getApiErrorMessage } from '../../../lib/api-error';

const inputClassName =
  'w-full rounded-lg border border-white/10 bg-[#0b1220] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-[#60a5fa] focus:bg-[#0b1220] focus:shadow-[0_0_0_3px_rgba(96,165,250,0.15)]';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await forgotPassword({ email });
      setSuccess(
        data.message ||
          'If an eligible account exists, password-reset instructions will be sent.'
      );
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to request password-reset instructions.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Forgot Password
        </h1>
        <p className="page-subtitle mt-1 text-sm">
          Enter your email to receive a reset link
        </p>
      </div>

      <div className="glass-card w-full max-w-[420px] rounded-2xl p-8">
        {error && (
          <p className="mb-4 text-center text-[0.8rem] text-red-300">{error}</p>
        )}
        {success && (
          <p className="mb-4 text-center text-[0.8rem] text-emerald-300">
            {success}
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
              disabled={Boolean(success)}
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-lg border-none bg-[#2563eb] py-3 text-[0.9rem] font-semibold text-white transition-colors duration-200 hover:enabled:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading || Boolean(success)}
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
          <Link
            className="mt-3 block w-full py-3 text-center text-sm text-slate-400 no-underline hover:text-slate-200"
            to="/login"
          >
            Back to sign in
          </Link>
        </form>
      </div>
    </div>
  );
}
