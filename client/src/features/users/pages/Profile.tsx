import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../auth/api";
import { getUserById } from "../api";
import type { UserByIdData } from "../types";
import { getStoredUser } from "../../../lib/stored-user";
import { PasswordInput } from "../../../components/PasswordInput";
import {
  isPasswordLongEnough,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_PLACEHOLDER,
} from "../../../lib/password-rules";
import { getApiErrorMessage } from "../../../lib/api-error";

const readOnlyInput =
  "w-full rounded-lg border border-white/10 bg-[#0b1220] p-3 text-sm text-slate-200 read-only:cursor-not-allowed read-only:text-slate-400 focus:border-[#60a5fa] focus:bg-[#0b1220] focus:outline-none";

const profilePasswordInputClass =
  "w-full rounded-lg border border-white/10 bg-[#0b1220] p-3 text-sm text-slate-200 outline-none focus:border-[#60a5fa] focus:ring-2 focus:ring-[rgba(96,165,250,0.15)]";

export default function Profile() {
  const navigate = useNavigate();
  const stored = getStoredUser();
  const [remote, setRemote] = useState<UserByIdData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(Boolean(stored?.id));

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    const id = stored?.id;
    if (!id) {
      setLoadingProfile(false);
      return;
    }
    // User list/detail APIs are admin-only; inspectors use data from login (stored user).
    if (stored.role !== "Admin") {
      setRemote({
        id: stored.id,
        username: stored.username,
        email: stored.email ?? "",
        role: stored.role,
      });
      setLoadingProfile(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadError("");
      try {
        const res = await getUserById(id);
        if (!cancelled) setRemote(res.data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(err, "Failed to load profile."));
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stored?.id, stored?.role, stored?.username, stored?.email]);

  const user = remote ?? stored;

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    if (!isPasswordLongEnough(newPassword)) {
      setPasswordError(PASSWORD_MIN_LENGTH_MESSAGE);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    setPasswordSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, "Failed to update password."));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="app-page pt-8">
      <div className="mx-auto mb-8 max-w-[1000px]">
        <h1 className="page-title mb-6 text-[2rem] font-bold">
          Profile Page:
        </h1>
      </div>
      <div className="glass-card flex items-center gap-8 px-8 py-4">
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 border-none bg-transparent text-sm font-semibold text-slate-300 hover:text-[#60a5fa]"
          onClick={() => navigate("/")}
        >
          ← Back to Dashboard
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Profile Settings</h2>
          <p className="text-xs text-slate-400">
            Manage your account information
          </p>
        </div>
      </div>

      <div className="mx-auto my-8 flex max-w-[800px] flex-col gap-6">
        {loadError && (
          <div className="rounded-lg bg-red-500/10 px-4 py-4 text-sm text-red-300">
            {loadError}
          </div>
        )}
        <div className="glass-card rounded-xl p-8">
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-[1.1rem] text-slate-100">
              👤 Account Information
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Your basic account details
            </p>
          </div>
          {loadingProfile ? (
            <p className="py-4 text-center text-sm text-slate-400">Loading…</p>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-400">
                    Username
                  </label>
                  <input
                    type="text"
                    className={readOnlyInput}
                    value={user?.username ?? ""}
                    readOnly
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#475569]">
                    Email
                  </label>
                  <input
                    type="email"
                    className={readOnlyInput}
                    value={user?.email ?? "—"}
                    readOnly
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#475569]">
                    Role
                  </label>
                  <input
                    type="text"
                    className={readOnlyInput}
                    value={user?.role ?? ""}
                    readOnly
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="glass-card rounded-xl p-8">
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-[1.1rem] text-slate-100">
              🔒 Security Settings
            </h3>
            <p className="mt-1 text-sm text-slate-400">Change your password</p>
          </div>
          {passwordError && (
            <div className="mb-4 rounded-lg bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="mb-4 rounded-lg bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
              {passwordSuccess}
            </div>
          )}
          <div className="mb-4">
            <PasswordInput
              id="current-password"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter current password"
              autoComplete="current-password"
              inputClassName={profilePasswordInputClass}
            />
          </div>
          <div className="mb-4">
            <PasswordInput
              id="new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder={PASSWORD_PLACEHOLDER}
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              inputClassName={profilePasswordInputClass}
            />
          </div>
          <div className="mb-6">
            <PasswordInput
              id="confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              inputClassName={profilePasswordInputClass}
            />
          </div>
          <button
            type="button"
            disabled={passwordSubmitting}
            className="cursor-pointer rounded-lg border-none bg-[#2563eb] px-6 py-3 font-semibold text-white hover:enabled:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void handleChangePassword()}
          >
            {passwordSubmitting ? "Updating…" : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
