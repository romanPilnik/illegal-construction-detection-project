import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api';
import { getApiErrorMessage } from '../../../lib/api-error';

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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Forgot Password
        </h1>
        <p className="page-subtitle mt-1 text-sm">
          Enter your email to receive a reset link
        </p>
      </div>

      <div className="glass-card auth-card glass-card-elevated">
        {error && (
          <p className="alert alert-error mb-4 text-center text-[0.8rem]">{error}</p>
        )}
        {success && (
          <p className="alert alert-success mb-4 text-center text-[0.8rem]">
            {success}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="form-label">
              Email
            </label>
            <input
              className="form-input"
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
            className="btn btn-primary mt-2 w-full py-3 text-[0.9rem]"
            disabled={loading || Boolean(success)}
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
          <Link
            className="mt-3 block w-full py-3 text-center text-sm text-slate-500 no-underline hover:text-slate-700"
            to="/login"
          >
            Back to sign in
          </Link>
        </form>
      </div>
    </div>
  );
}
