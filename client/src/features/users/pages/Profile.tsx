import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../auth/api";
import { getUserById } from "../api";
import type { UserByIdData, UserRole } from "../types";
import { getStoredUser } from "../../../lib/stored-user";

const readOnlyInput =
  "w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm text-[#1e293b] read-only:cursor-not-allowed read-only:text-[#64748b] focus:border-[#2563eb] focus:bg-white focus:outline-none";

const passwordInput =
  "w-full rounded-lg border border-[#e2e8f0] bg-white p-3 text-sm text-[#1e293b] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[rgba(37,99,235,0.15)]";

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
        role: stored.role as UserRole,
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
          if (isAxiosError(err)) {
            const data = err.response?.data as { message?: string } | undefined;
            setLoadError(data?.message ?? "Failed to load profile");
          } else {
            setLoadError("Failed to load profile");
          }
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
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
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
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        setPasswordError(data?.message ?? "Failed to update password");
      } else {
        setPasswordError("Failed to update password");
      }
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] pt-8 [font-:'Segoe_UI',system-ui,sans-serif]">
      <div className="mx-auto mb-8 max-w-[1000px]">
        <h1 className="mb-6 text-[2rem] font-bold text-[#1e293b]">
          Profile Page:
        </h1>
      </div>
      <div className="flex items-center gap-8 border-b border-t border-[#e2e8f0] bg-white px-8 py-4">
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 border-none bg-transparent text-sm font-semibold text-[#64748b] hover:text-[#2563eb]"
          onClick={() => navigate("/")}
        >
          ← Back to Dashboard
        </button>
        <div>
          <h2 className="text-lg font-bold text-[#1e293b]">Profile Settings</h2>
          <p className="text-xs text-[#64748b]">
            Manage your account information
          </p>
        </div>
      </div>

      <div className="mx-auto my-8 flex max-w-[800px] flex-col gap-6">
        {loadError && (
          <div className="rounded-lg bg-[#fef2f2] px-4 py-4 text-sm text-[#b91c1c]">
            {loadError}
          </div>
        )}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-[1.1rem] text-[#1e293b]">
              👤 Account Information
            </h3>
            <p className="mt-1 text-sm text-[#64748b]">
              Your basic account details
            </p>
          </div>
          {loadingProfile ? (
            <p className="py-4 text-center text-sm text-[#64748b]">Loading…</p>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#475569]">
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
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#475569]">
                    User ID
                  </label>
                  <input
                    type="text"
                    className={readOnlyInput}
                    value={user?.id ?? ""}
                    readOnly
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-[#e2e8f0] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-[1.1rem] text-[#1e293b]">
              🔒 Security Settings
            </h3>
            <p className="mt-1 text-sm text-[#64748b]">Change your password</p>
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
            <label className="mb-2 block text-sm font-semibold text-[#475569]">
              Current Password
            </label>
            <input
              type="password"
              className={passwordInput}
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-[#475569]">
              New Password
            </label>
            <input
              type="password"
              className={passwordInput}
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-[#475569]">
              Confirm New Password
            </label>
            <input
              type="password"
              className={passwordInput}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
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
