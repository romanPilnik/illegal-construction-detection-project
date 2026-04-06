import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { getUserById } from '../api'
import type { UserByIdData } from '../types'
import { getStoredUser } from '../../../lib/stored-user'

const readOnlyInput =
    'w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm text-[#1e293b] read-only:cursor-not-allowed read-only:text-[#64748b] focus:border-[#2563eb] focus:bg-white focus:outline-none'

export default function Profile() {
    const navigate = useNavigate()
    const stored = getStoredUser()
    const [remote, setRemote] = useState<UserByIdData | null>(null)
    const [loadError, setLoadError] = useState('')
    const [loadingProfile, setLoadingProfile] = useState(Boolean(stored?.id))

    useEffect(() => {
        const id = stored?.id
        if (!id) {
            setLoadingProfile(false)
            return
        }
        let cancelled = false
        ;(async () => {
            setLoadError('')
            try {
                const res = await getUserById(id)
                if (!cancelled) setRemote(res.data)
            } catch (err) {
                if (!cancelled) {
                    if (isAxiosError(err)) {
                        const data = err.response?.data as { message?: string } | undefined
                        setLoadError(data?.message ?? 'Failed to load profile')
                    } else {
                        setLoadError('Failed to load profile')
                    }
                }
            } finally {
                if (!cancelled) setLoadingProfile(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [stored?.id])

    const user = remote ?? stored

    return (
        <div className="min-h-screen bg-[#f0f4f8] pt-8 [font-family:'Segoe_UI',system-ui,sans-serif]">
            <div className="mx-auto mb-8 max-w-[1000px]">
                <h1 className="mb-6 text-[2rem] font-bold text-[#1e293b]">Profile Page:</h1>
            </div>
            <div className="flex items-center gap-8 border-b border-t border-[#e2e8f0] bg-white px-8 py-4">
                <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2 border-none bg-transparent text-sm font-semibold text-[#64748b] hover:text-[#2563eb]"
                    onClick={() => navigate('/')}
                >
                    ← Back to Dashboard
                </button>
                <div>
                    <h2 className="text-lg font-bold text-[#1e293b]">Profile Settings</h2>
                    <p className="text-xs text-[#64748b]">Manage your account information</p>
                </div>
            </div>

            <div className="mx-auto my-8 flex max-w-[800px] flex-col gap-6">
                {loadError && (
                    <div className="rounded-lg bg-[#fef2f2] px-4 py-4 text-sm text-[#b91c1c]">{loadError}</div>
                )}
                <div className="rounded-xl border border-[#e2e8f0] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                    <div className="mb-6">
                        <h3 className="flex items-center gap-2 text-[1.1rem] text-[#1e293b]">👤 Account Information</h3>
                        <p className="mt-1 text-sm text-[#64748b]">Your basic account details</p>
                    </div>
                    {loadingProfile ? (
                        <p className="py-4 text-center text-sm text-[#64748b]">Loading…</p>
                    ) : (
                        <>
                            <div className="mb-6 grid grid-cols-2 gap-6">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#475569]">Username</label>
                                    <input type="text" className={readOnlyInput} value={user?.username ?? ''} readOnly />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#475569]">Email</label>
                                    <input type="email" className={readOnlyInput} value={user?.email ?? '—'} readOnly />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#475569]">Role</label>
                                    <input type="text" className={readOnlyInput} value={user?.role ?? ''} readOnly />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#475569]">User ID</label>
                                    <input type="text" className={readOnlyInput} value={user?.id ?? ''} readOnly />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-[#475569]">Account Status</label>
                                <div className="flex items-center gap-1 font-semibold text-[#166534]">✅ Active</div>
                            </div>
                        </>
                    )}
                </div>

                <div className="rounded-xl border border-[#e2e8f0] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                    <div className="mb-6">
                        <h3 className="flex items-center gap-2 text-[1.1rem] text-[#1e293b]">🔒 Security Settings</h3>
                        <p className="mt-1 text-sm text-[#64748b]">Change your password</p>
                    </div>
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-semibold text-[#475569]">Current Password</label>
                        <input type="password" className={readOnlyInput} placeholder="Enter current password" />
                    </div>
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-semibold text-[#475569]">New Password</label>
                        <input type="password" className={readOnlyInput} placeholder="Enter new password" />
                    </div>
                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-semibold text-[#475569]">Confirm New Password</label>
                        <input type="password" className={readOnlyInput} placeholder="Confirm new password" />
                    </div>
                    <button type="button" className="cursor-pointer rounded-lg border-none bg-[#2563eb] px-6 py-3 font-semibold text-white hover:bg-[#1d4ed8]">
                        Update Password
                    </button>
                </div>
            </div>
        </div>
    )
}
