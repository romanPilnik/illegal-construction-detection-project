import { useState } from 'react'
import { api } from '../services/api'

interface Props {
    onRegisterSuccess: (token: string) => void
    onNavigateToLogin: () => void
}

export default function Register({ onRegisterSuccess, onNavigateToLogin }: Props) {
    // השדות המדויקים לפי הפוסטמן
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('Inspector') // ברירת מחדל

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // שליחת האובייקט בדיוק כפי שהופיע בפוסטמן
            const data = await api.post('/auth/register', {
                username,
                email,
                password,
                role
            })

            if (data.token) {
                localStorage.setItem('token', data.token)
                onRegisterSuccess(data.token)
            } else {
                setError(data.message || 'Registration failed')
            }
        } catch (err: any) {
            // הצגת הודעת השגיאה המדויקת מהשרת (אם יש כזו ב-Response)
            const serverMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.message;
            setError(serverMessage || 'Something went wrong during registration');
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .login-page { min-height: 100vh; background: linear-gradient(135deg, #e8edf5 0%, #f0f4fb 50%, #e4eaf4 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Segoe UI', system-ui, sans-serif; padding: 2rem 0; }
        .login-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 2rem; }
        .login-icon { width: 56px; height: 56px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); }
        .login-icon svg { width: 28px; height: 28px; fill: white; }
        .login-title { font-size: 1.5rem; font-weight: 700; color: #1e293b; letter-spacing: -0.02em; }
        .login-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }
        .login-card { background: white; border-radius: 16px; padding: 2rem; width: 100%; max-width: 380px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); }
        .form-group { margin-bottom: 1.25rem; }
        .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem; }
        .form-input, .form-select { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; color: #1e293b; background: #f8fafc; outline: none; transition: all 0.2s; }
        .form-input:focus, .form-select:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); background: white; }
        .submit-btn { width: 100%; padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 0.5rem; }
        .submit-btn:hover:not(:disabled) { background: #059669; }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .switch-btn { width: 100%; padding: 0.75rem; background: transparent; color: #64748b; border: none; font-size: 0.875rem; cursor: pointer; margin-top: 0.5rem; text-decoration: underline; }
        .switch-btn:hover { color: #1e293b; }
        .error-msg { color: #ef4444; font-size: 0.8rem; margin-bottom: 1rem; text-align: center; }
      `}</style>

            <div className="login-page">
                <div className="login-header">
                    <div className="login-icon">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </div>
                    <h1 className="login-title">Register Account</h1>
                    <p className="login-subtitle">Create a new municipal profile</p>
                </div>

                <div className="login-card">
                    {error && <p className="error-msg">{error}</p>}
                    <form onSubmit={handleSubmit}>
                        {/* שדה Username */}
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input className="form-input" type="text" placeholder="e.g. shirel_test" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>

                        {/* שדה Email */}
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input className="form-input" type="email" placeholder="admin@test.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>

                        {/* שדה Role */}
                        <div className="form-group">
                            <label className="form-label">System Role</label>
                            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                                <option value="Inspector">Inspector</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>

                        {/* שדה Password */}
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input className="form-input" type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>

                        <button className="submit-btn" type="submit" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>

                        <button className="switch-btn" type="button" onClick={onNavigateToLogin}>
                            Already have an account? Sign In
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}