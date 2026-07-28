import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api';
import { PasswordInput } from '../../../components/PasswordInput';
import {
  isPasswordLongEnough,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_PLACEHOLDER,
} from '../../../lib/password-rules';
import { getApiErrorMessage } from '../../../lib/api-error';

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
      setError(getApiErrorMessage(err, 'Failed to reset password.'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="app-page flex min-h-screen flex-col items-center justify-center px-4">
        <div className="glass-card auth-card glass-card-elevated text-center">
          <p className="alert alert-error mb-4 text-[0.9rem]">
            This reset link is invalid or missing a token.
          </p>
          <Link
            className="text-sm text-[#2563eb] no-underline hover:underline"
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset Password
        </h1>
        <p className="page-subtitle mt-1 text-sm">Choose a new password</p>
      </div>

      <div className="glass-card auth-card glass-card-elevated">
        {error && (
          <p className="alert alert-error mb-4 text-center text-[0.8rem]">{error}</p>
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
              inputClassName="form-input pr-11"
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
              inputClassName="form-input pr-11"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary mt-2 w-full py-3 text-[0.9rem]"
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Reset password'}
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
