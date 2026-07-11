import React, { useState } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api';
import { PasswordInput } from '../../../components/PasswordInput';
import {
  isPasswordLongEnough,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_PLACEHOLDER,
} from '../../../lib/password-rules';

function messageFromAxios(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Array<{ message?: string }> }
      | undefined;
    if (data?.errors?.length) {
      return data.errors.map((e) => e.message).filter(Boolean).join('; ');
    }
    return data?.message ?? fallback;
  }
  return fallback;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    if (!isPasswordLongEnough(newPassword)) {
      setError(PASSWORD_MIN_LENGTH_MESSAGE);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      navigate('/login', {
        replace: true,
        state: { passwordReset: true },
      });
    } catch (err: unknown) {
      setError(messageFromAxios(err, 'Failed to reset password'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="app-page flex min-h-screen flex-col items-center justify-center px-4">
        <div className="glass-card w-full max-w-[420px] rounded-2xl p-8 text-center">
          <p className="mb-4 text-[0.9rem] text-red-300">
            This reset link is invalid or missing a token.
          </p>
          <Link
            className="text-sm text-[#60a5fa] no-underline hover:underline"
            to="/forgot-password"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Reset Password
        </h1>
        <p className="page-subtitle mt-1 text-sm">Choose a new password</p>
      </div>

      <div className="glass-card w-full max-w-[420px] rounded-2xl p-8">
        {error && (
          <p className="mb-4 text-center text-[0.8rem] text-red-300">{error}</p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <PasswordInput
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder={PASSWORD_PLACEHOLDER}
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
            />
          </div>
          <div className="mb-5">
            <PasswordInput
              id="confirm-password"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-lg border-none bg-[#2563eb] py-3 text-[0.9rem] font-semibold text-white transition-colors duration-200 hover:enabled:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Reset password'}
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
