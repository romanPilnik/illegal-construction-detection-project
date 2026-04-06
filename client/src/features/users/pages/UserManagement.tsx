import { useCallback, useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { deactivateUser, getUsers, updateUser } from '../api'
import type { UserListRow, UserRole } from '../types'
import { getStoredUser } from '../../../lib/stored-user'

const PAGE_SIZE = 10

function roleBadgeClasses(role: UserRole) {
    const base = 'inline-block rounded-full px-2.5 py-1 text-[0.7rem] font-semibold'
    if (role === 'Admin') return `${base} bg-[#f3e8ff] text-[#9333ea]`
    return `${base} bg-[#e0f2fe] text-[#0284c7]`
}

function messageFromAxios(err: unknown, fallback: string): string {
    if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined
        return data?.message ?? fallback
    }
    return fallback
}

export default function UserManagement() {
    const navigate = useNavigate()
    const currentUserId = getStoredUser()?.id

    const [users, setUsers] = useState<UserListRow[]>([])
    const [meta, setMeta] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        hasNextPage: false,
    })
    const [page, setPage] = useState(1)
    const [searchInput, setSearchInput] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<'' | UserRole>('')
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active')

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionError, setActionError] = useState('')

    const [editing, setEditing] = useState<UserListRow | null>(null)
    const [editUsername, setEditUsername] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const t = window.setTimeout(() => {
            setDebouncedSearch(searchInput.trim())
            setPage(1)
        }, 300)
        return () => window.clearTimeout(t)
    }, [searchInput])

    const loadUsers = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await getUsers({
                page,
                limit: PAGE_SIZE,
                ...(roleFilter ? { role: roleFilter } : {}),
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
                isActiveFilter: statusFilter === 'inactive' ? '1' : '0',
            })
            setUsers(res.data)
            setMeta({
                page: res.meta.page,
                totalPages: res.meta.totalPages,
                total: res.meta.total,
                hasNextPage: res.meta.hasNextPage,
            })
        } catch (err) {
            setError(messageFromAxios(err, 'Failed to load users'))
            setUsers([])
        } finally {
            setLoading(false)
        }
    }, [page, debouncedSearch, roleFilter, statusFilter])

    useEffect(() => {
        void loadUsers()
    }, [loadUsers])

    const openEdit = (u: UserListRow) => {
        setActionError('')
        setEditing(u)
        setEditUsername(u.username)
        setEditEmail(u.email)
    }

    const closeEdit = () => {
        setEditing(null)
        setActionError('')
    }

    const handleSaveEdit = async () => {
        if (!editing) return
        const username = editUsername.trim()
        const email = editEmail.trim()
        if (!username || !email) {
            setActionError('Username and email are required.')
            return
        }
        if (username === editing.username && email === editing.email) {
            closeEdit()
            return
        }
        setSaving(true)
        setActionError('')
        try {
            const body: { username?: string; email?: string } = {}
            if (username !== editing.username) body.username = username
            if (email !== editing.email) body.email = email
            await updateUser(editing.id, body)
            closeEdit()
            await loadUsers()
        } catch (err) {
            setActionError(messageFromAxios(err, 'Failed to update user'))
        } finally {
            setSaving(false)
        }
    }

    const handleDeactivate = async (u: UserListRow) => {
        if (u.id === currentUserId) {
            setActionError('You cannot deactivate your own account.')
            return
        }
        if (!window.confirm(`Deactivate user ${u.email}? They will no longer be able to sign in.`)) {
            return
        }
        setActionError('')
        try {
            await deactivateUser(u.id)
            await loadUsers()
        } catch (err) {
            setActionError(messageFromAxios(err, 'Failed to deactivate user'))
        }
    }

    const btnSecondary =
        'flex cursor-pointer items-center gap-2 rounded-md border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50'
    const btnPrimary =
        'flex cursor-pointer items-center gap-2 rounded-md border-none bg-[#2563eb] px-4 py-2 font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50'

    return (
        <div className="min-h-screen bg-[#f0f4f8] pt-8 [font-family:'Segoe_UI',system-ui,sans-serif]">
            <div className="mx-auto mb-8 max-w-[1100px]">
                <h1 className="mb-6 text-[2rem] font-bold text-[#1e293b]">Admin UserManagement Page:</h1>
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
                    <h2 className="text-lg font-bold text-[#1e293b]">User Management</h2>
                    <p className="text-xs text-[#64748b]">Manage users and permissions</p>
                </div>
            </div>

            {error && (
                <div className="mx-auto mt-4 max-w-[1100px] rounded-lg bg-[#fef2f2] px-4 py-4 text-sm text-[#b91c1c]">
                    {error}
                </div>
            )}
            {actionError && !editing && (
                <div className="mx-auto mt-4 max-w-[1100px] rounded-lg bg-[#fef2f2] px-4 py-4 text-sm text-[#b91c1c]">
                    {actionError}
                </div>
            )}

            <div className="mx-auto my-8 max-w-[1100px]">
                <div className="rounded-xl border border-[#e2e8f0] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="flex items-center gap-2 text-[1.1rem] text-[#1e293b]">👥 All Users</h3>
                            <p className="mt-1 text-sm text-[#64748b]">Manage user accounts and roles</p>
                        </div>
                        <button
                            type="button"
                            className={btnPrimary}
                            onClick={() => navigate('/register')}
                        >
                            + Add User
                        </button>
                    </div>

                    <div className="mb-6 flex flex-wrap gap-4">
                        <input
                            type="text"
                            className="min-w-[200px] flex-1 rounded-lg border border-[#e2e8f0] px-4 py-3 text-sm outline-none focus:border-[#2563eb]"
                            placeholder="🔍 Search by username or email..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                        <select
                            className="rounded-lg border border-[#e2e8f0] px-4 py-3 text-sm text-[#1e293b] outline-none focus:border-[#2563eb]"
                            value={roleFilter}
                            onChange={e => {
                                setRoleFilter(e.target.value as '' | UserRole)
                                setPage(1)
                            }}
                        >
                            <option value="">All roles</option>
                            <option value="Admin">Admin</option>
                            <option value="Inspector">Inspector</option>
                        </select>
                        <select
                            className="rounded-lg border border-[#e2e8f0] px-4 py-3 text-sm text-[#1e293b] outline-none focus:border-[#2563eb]"
                            value={statusFilter}
                            onChange={e => {
                                setStatusFilter(e.target.value as 'active' | 'inactive')
                                setPage(1)
                            }}
                        >
                            <option value="active">Active only</option>
                            <option value="inactive">Inactive only</option>
                        </select>
                    </div>

                    {loading ? (
                        <p className="py-12 text-center text-[#64748b]">Loading…</p>
                    ) : users.length === 0 ? (
                        <p className="py-12 text-center text-[#64748b]">No users match your filters.</p>
                    ) : (
                        <>
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr>
                                        <th className="border-b-2 border-[#e2e8f0] px-4 py-4 text-sm font-semibold text-[#475569]">
                                            Username
                                        </th>
                                        <th className="border-b-2 border-[#e2e8f0] px-4 py-4 text-sm font-semibold text-[#475569]">
                                            Email
                                        </th>
                                        <th className="border-b-2 border-[#e2e8f0] px-4 py-4 text-sm font-semibold text-[#475569]">
                                            Role
                                        </th>
                                        <th className="border-b-2 border-[#e2e8f0] px-4 py-4 text-sm font-semibold text-[#475569]">
                                            Status
                                        </th>
                                        <th className="border-b-2 border-[#e2e8f0] px-4 py-4 text-sm font-semibold text-[#475569]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td className="border-b border-[#e2e8f0] px-4 py-4 text-sm font-semibold text-[#1e293b]">
                                                {u.username}
                                            </td>
                                            <td className="border-b border-[#e2e8f0] px-4 py-4 text-sm text-[#1e293b]">
                                                {u.email}
                                            </td>
                                            <td className="border-b border-[#e2e8f0] px-4 py-4 text-sm">
                                                <span className={roleBadgeClasses(u.role)}>{u.role}</span>
                                            </td>
                                            <td className="border-b border-[#e2e8f0] px-4 py-4 text-sm">
                                                <span
                                                    className={
                                                        u.is_active
                                                            ? 'font-semibold text-[#166534]'
                                                            : 'font-semibold text-[#94a3b8]'
                                                    }
                                                >
                                                    {u.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="border-b border-[#e2e8f0] px-4 py-4 text-sm text-[#94a3b8]">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        className="cursor-pointer border-none bg-transparent p-0 hover:text-[#2563eb]"
                                                        title="Edit"
                                                        onClick={() => openEdit(u)}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="cursor-pointer border-none bg-transparent p-0 hover:text-[#ef4444] disabled:cursor-not-allowed disabled:opacity-40"
                                                        title={
                                                            u.id === currentUserId
                                                                ? 'Cannot deactivate yourself'
                                                                : 'Deactivate'
                                                        }
                                                        disabled={
                                                            !u.is_active || u.id === currentUserId
                                                        }
                                                        onClick={() => handleDeactivate(u)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#e2e8f0] pt-6">
                                <p className="text-sm text-[#64748b]">
                                    {meta.total} user{meta.total !== 1 ? 's' : ''} · Page {meta.page} of{' '}
                                    {Math.max(1, meta.totalPages)}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className={btnSecondary}
                                        disabled={page <= 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        className={btnSecondary}
                                        disabled={!meta.hasNextPage}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {editing && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    role="presentation"
                    onClick={closeEdit}
                >
                    <div
                        className="w-full max-w-md rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-lg"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-user-title"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 id="edit-user-title" className="mb-4 text-lg font-bold text-[#1e293b]">
                            Edit user
                        </h3>
                        {actionError && (
                            <div className="mb-4 rounded-lg bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
                                {actionError}
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-semibold text-[#475569]">
                                Username
                            </label>
                            <input
                                type="text"
                                className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm outline-none focus:border-[#2563eb]"
                                value={editUsername}
                                onChange={e => setEditUsername(e.target.value)}
                            />
                        </div>
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-semibold text-[#475569]">
                                Email
                            </label>
                            <input
                                type="email"
                                className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm outline-none focus:border-[#2563eb]"
                                value={editEmail}
                                onChange={e => setEditEmail(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" className={btnSecondary} onClick={closeEdit}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={btnPrimary}
                                disabled={saving}
                                onClick={() => void handleSaveEdit()}
                            >
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
