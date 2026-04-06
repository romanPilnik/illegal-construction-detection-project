import { useNavigate } from 'react-router-dom'
import { clearAuthStorage, getStoredUser } from '../../../lib/stored-user'

export default function Dashboard() {
    const navigate = useNavigate()
    const user = getStoredUser()
    const isAdmin = user?.role === 'Admin'

    const handleLogout = () => {
        clearAuthStorage()
        navigate('/login', { replace: true })
    }

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#f0f4f8_0%,#ffffff_100%)] text-[#1a202c] [font-family:'Segoe_UI',system-ui,sans-serif]">
            <nav className="flex items-center justify-between border-b border-[#e2e8f0] bg-white px-8 py-3 text-[#1a202c] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f1f5f9] text-base font-bold text-[#2563eb]">
                        C
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[#1e293b]">Construction Compliance</h2>
                        <p className="-mt-px text-xs text-[#64748b]">
                            Welcome{user?.username ? `, ${user.username}` : ''}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-[#64748b] transition-all duration-200 hover:bg-[#fee2e2] hover:text-[#ef4444]"
                    onClick={handleLogout}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                </button>
            </nav>

            <main className="mx-auto max-w-[1200px] p-10">
                <section>
                    <h2 className="mb-5 mt-6 text-sm font-semibold uppercase tracking-[0.05em] text-[#64748b]">
                        Quick Actions
                    </h2>
                    <div
                        className="relative flex cursor-pointer items-center gap-6 rounded-xl bg-[#2563eb] px-8 py-6 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#1d4ed8]"
                        onClick={() => navigate('/submit')}
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15">
                            <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM12 18l-3-3h2v-4h2v4h2l-3 3z"/></svg>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold">Upload New Analysis</h3>
                            <p className="mt-[0.15rem] text-sm opacity-90">Submit before and after images for AI analysis</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="mb-5 mt-6 text-sm font-semibold uppercase tracking-[0.05em] text-[#64748b]">
                        Navigation
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
                        <div
                            className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-[#2563eb] hover:bg-[#f8fafc] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                            onClick={() => navigate('/analyses')}
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f1f5f9] text-[#2563eb]">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                            <div>
                                <h3 className="text-[0.9rem] font-semibold text-[#1e293b]">Analysis History</h3>
                                <p className="mt-[0.15rem] text-xs text-[#64748b]">View all submitted analyses and results</p>
                            </div>
                        </div>
                        <div
                            className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-[#2563eb] hover:bg-[#f8fafc] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                            onClick={() => navigate('/profile')}
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f1f5f9] text-[#2563eb]">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                            <div>
                                <h3 className="text-[0.9rem] font-semibold text-[#1e293b]">Profile</h3>
                                <p className="mt-[0.15rem] text-xs text-[#64748b]">Manage your account settings</p>
                            </div>
                        </div>
                        {isAdmin && (
                            <>
                                <div
                                    className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-[#2563eb] hover:bg-[#f8fafc] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                                    onClick={() => navigate('/users')}
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f1f5f9] text-[#2563eb]">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-[0.9rem] font-semibold text-[#1e293b]">User Management</h3>
                                        <p className="mt-[0.15rem] text-xs text-[#64748b]">Manage users and permissions</p>
                                    </div>
                                </div>
                                <div
                                    className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-[#2563eb] hover:bg-[#f8fafc] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                                    onClick={() => navigate('/logs')}
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f1f5f9] text-[#2563eb]">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-[0.9rem] font-semibold text-[#1e293b]">Audit logs</h3>
                                        <p className="mt-[0.15rem] text-xs text-[#64748b]">Review system activity</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="mb-5 mt-6 text-sm font-semibold uppercase tracking-[0.05em] text-[#64748b]">
                        Overview
                    </h2>
                    <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                            <div className="text-[0.8rem] font-medium text-[#64748b]">Total Analyses</div>
                            <div className="mt-2 text-4xl font-bold text-[#2563eb]">24</div>
                        </div>
                        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                            <div className="text-[0.8rem] font-medium text-[#64748b]">Pending Results</div>
                            <div className="mt-2 text-4xl font-bold text-[#f59e0b]">3</div>
                        </div>
                        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                            <div className="text-[0.8rem] font-medium text-[#64748b]">Completed This Week</div>
                            <div className="mt-2 text-4xl font-bold text-[#166534]">7</div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
