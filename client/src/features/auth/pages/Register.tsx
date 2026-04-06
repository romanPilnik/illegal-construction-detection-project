import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../../services/api'
import axios from 'axios'

const fieldClassName =
    'w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5 text-sm text-[#1e293b] outline-none transition-all duration-200 focus:border-[#10b981] focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]'

export default function Register() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('Inspector')

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await api.post('/auth/register', { username, email, password, role })

            if (response.status === 201 && response.data?.userId) {
                navigate('/login', { replace: true, state: { registered: true } })
                return
            }

            setError(response.data?.message || 'Registration failed')
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Registration failed')
            } else {
                setError('Something went wrong')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(135deg,#e8edf5_0%,#f0f4fb_50%,#e4eaf4_100%)] py-8 [font-family:'Segoe_UI',system-ui,sans-serif]">
            <div className="mb-8 flex flex-col items-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#10b981] shadow-[0_4px_14px_rgba(16,185,129,0.35)]">
                    <svg className="h-7 w-7 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">Register Account</h1>
                <p className="mt-1 text-sm text-[#64748b]">Create a new municipal profile</p>
            </div>

            <div className="w-full max-w-[380px] rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                {error && <p className="mb-4 text-center text-[0.8rem] text-[#ef4444]">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-medium text-[#374151]">Username</label>
                        <input className={fieldClassName} type="text" placeholder="e.g. shirel_test" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>

                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-medium text-[#374151]">Email Address</label>
                        <input className={fieldClassName} type="email" placeholder="admin@test.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>

                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-medium text-[#374151]">System Role</label>
                        <select className={fieldClassName} value={role} onChange={e => setRole(e.target.value)}>
                            <option value="Inspector">Inspector</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-medium text-[#374151]">Password</label>
                        <input className={fieldClassName} type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    <button
                        type="submit"
                        className="mt-2 w-full rounded-lg border-none bg-[#10b981] py-3 text-[0.9rem] font-semibold text-white transition-colors duration-200 hover:enabled:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <Link
                        className="mt-2 block w-full cursor-pointer border-none bg-transparent py-3 text-center text-sm text-[#64748b] no-underline hover:text-[#1e293b]"
                        to="/login"
                    >
                        Already have an account? Sign In
                    </Link>
                </form>
            </div>
        </div>
    )
}
