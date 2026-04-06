import { useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import SubmitAnalysis from './pages/SubmitAnalysis'
import UserManagement from './pages/UserManagement'
import AnalysisHistory from './pages/AnalysisHistory'

type Page = 'login' | 'register' | 'dashboard' | 'profile' | 'submit' | 'users' | 'analysis'

function App() {
    console.log('API URL:', import.meta.env.VITE_API_URL) // ← add here

    const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
    const [page, setPage] = useState<Page>('dashboard')

    const handleLogin = (token: string) => {
        setToken(token)
        setPage('dashboard')
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setPage('login')
    }

    if (!token) {
        if (page === 'register') {
            return <Register onRegisterSuccess={handleLogin} onNavigateToLogin={() => setPage('login')} />
        }
        return <Login onLogin={handleLogin} onNavigateToRegister={() => setPage('register')} />
    }

    if (page === 'profile') return <Profile onBack={() => setPage('dashboard')} />
    if (page === 'submit') return <SubmitAnalysis onBack={() => setPage('dashboard')} />
    if (page === 'users') return <UserManagement onBack={() => setPage('dashboard')} />
    if (page === 'analysis') return <AnalysisHistory onBack={() => setPage('dashboard')} />

    return (
        <Dashboard
            onLogout={handleLogout}
            onNavigateToSubmit={() => setPage('submit')}
            onNavigateToAnalysis={() => setPage('analysis')}
            onNavigateToProfile={() => setPage('profile')}
            onNavigateToUsers={() => setPage('users')}
        />
    )
}

export default App