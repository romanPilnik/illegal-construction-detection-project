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
import { PageHeaderBar } from "../../../components/PageHeaderBar";

const readOnlyInput = "form-input read-only:cursor-not-allowed";

const profilePasswordInputClass = "form-input pr-11";

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
      <div className="mx-auto mb-8 max-w-275">
        <h1 className="page-title mb-6 text-[2rem] font-bold">Profile</h1>
      </div>
      <PageHeaderBar
        title="Profile Settings"
        subtitle="Manage your account information"
        onBack={() => navigate("/")}
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        }
      />

      <div className="mx-auto my-6 flex max-w-275 flex-col gap-6">
        {loadError && <div className="alert alert-error">{loadError}</div>}
        <div className="glass-card glass-card-elevated p-8">
          <div className="mb-6">
            <h3 className="card-heading flex items-center gap-2">
              👤 Account Information
            </h3>
            <p className="card-subheading">Your basic account details</p>
          </div>
          {loadingProfile ? (
            <p className="py-4 text-center text-sm text-slate-400">Loading…</p>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className={readOnlyInput}
                    value={user?.username ?? ""}
                    readOnly
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={readOnlyInput}
                    value={user?.email ?? "—"}
                    readOnly
                  />
                </div>
                <div>
                  <label className="form-label">Role</label>
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

        <div className="glass-card glass-card-elevated p-8">
          <div className="mb-6">
            <h3 className="card-heading flex items-center gap-2">
              🔒 Security Settings
            </h3>
            <p className="card-subheading">Change your password</p>
          </div>
          {passwordError && (
            <div className="alert alert-error mb-4">{passwordError}</div>
          )}
          {passwordSuccess && (
            <div className="alert alert-success mb-4">{passwordSuccess}</div>
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
            className="btn btn-primary px-6 py-3"
            onClick={() => void handleChangePassword()}
          >
            {passwordSubmitting ? "Updating…" : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
