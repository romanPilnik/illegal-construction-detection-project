import React, { useState } from 'react'
import axios from 'axios'
import { api } from '../services/api'

interface Props {
    onLogin: (token: string) => void
    onNavigateToRegister: () => void
}

export default function Login({ onLogin , onNavigateToRegister}: Props) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // שימי לב לשינוי כאן: אנחנו מחלצים את data מתוך התשובה של Axios
            const response = await api.post('/auth/login', { email, password })

            // ב-Axios, המידע מהשרת תמיד נמצא בתוך response.data
            const { token, message } = response.data

            if (token) {
                localStorage.setItem('token', token)
                onLogin(token)
            } else {
                setError(message || 'Login failed')
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Login failed')
            } else {
                setError('Something went wrong')
            }        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #e8edf5 0%, #f0f4fb 50%, #e4eaf4 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .login-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }

        .login-icon {
          width: 56px;
          height: 56px;
          background: #2563eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }

        .login-icon svg {
          width: 28px;
          height: 28px;
          fill: white;
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        .login-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          width: 100%;
          max-width: 380px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #1e293b;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        .form-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          background: white;
        }

        .submit-btn {
          width: 100%;
          padding: 0.75rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          margin-top: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .submit-btn:active:not(:disabled) {
          transform: scale(0.99);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .signup-btn {
          width: 100%; 
          padding: 0.75rem; 
          background: #f1f5f9; /* צבע אפור-כחלחל עדין שמייצר תחושה של כפתור אמיתי */
          color: #334155; 
          border: 1px solid #cbd5e1;
          border-radius: 8px; 
          font-size: 0.9rem; 
          font-weight: 600; 
          cursor: pointer; 
          transition: all 0.2s; 
          margin-top: 0.75rem; /* מרווח יפה מתחת לכפתור הראשון */
          text-align: center;
        }
        .signup-btn:hover { 
          background: #e2e8f0; /* מתכהה קצת כשמעבירים עכבר */
          border-color: #94a3b8;
        }
        .signup-btn:active { transform: scale(0.99); } /* אפקט לחיצה */

        .authorized-text {
          text-align: center;
          font-size: 0.8rem;
          color: #94a3b8;
          margin-top: 1rem;
        }

        .error-msg {
          color: #ef4444;
          font-size: 0.8rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        .login-footer {
          margin-top: 2rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }
      `}</style>

            <div className="login-page">
                <div className="login-header">
                    <div className="login-icon">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 18v-1h8v1H8zm0-3v-1h8v1H8zm0-3V11h5v1H8z"/>
                        </svg>
                    </div>
                    <h1 className="login-title">Construction Compliance</h1>
                    <p className="login-subtitle">Municipal Inspection Portal</p>
                </div>

                <div className="login-card">
                    {error && <p className="error-msg">{error}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                className="form-input"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button className="submit-btn" type="submit" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                        <button className="signup-btn" type="button" onClick={onNavigateToRegister}>
                            Sign Up
                        </button>
                        <p className="authorized-text">Authorized personnel only</p>
                    </form>
                </div>

                <p className="login-footer">© 2026 Municipal Construction Compliance System</p>
            </div>
        </>
    )
}
