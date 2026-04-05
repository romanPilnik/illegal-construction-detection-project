import { useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import SubmitAnalysis from './pages/SubmitAnalysis'
import AnalysisHistory from './pages/AnalysisHistory'
import Profile from './pages/Profile'
import UserManagement from './pages/UserManagement'

type PageType = 'login' | 'register' | 'dashboard' | 'submit' | 'analysis' | 'profile' | 'users'

function App() {
    // בדיקה ראשונית: האם המשתמש כבר מחובר?
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

    // אם יש טוקן - דשבורד. אם אין - לוגין.
    const [currentPage, setCurrentPage] = useState<PageType>(token ? 'dashboard' : 'login')

    // הפונקציה המרכזית שמעבירה לדשבורד אחרי הצלחה (לוגין או הרשמה)
    const handleAuthSuccess = (newToken: string) => {
        setToken(newToken);
        localStorage.setItem('token', newToken);
        setCurrentPage('dashboard'); // המעבר האוטומטי לדשבורד
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setCurrentPage('login')
    }

    const goHome = () => setCurrentPage('dashboard')

    // ניהול הניווט (Routing)
    switch (currentPage) {
        case 'login':
            return <Login
                onLogin={handleAuthSuccess} // מעבר לדשבורד אחרי לוגין
                onNavigateToRegister={() => setCurrentPage('register')}
            />
        case 'register':
            return <Register
                onRegisterSuccess={handleAuthSuccess} // מעבר לדשבורד אחרי הרשמה
                onNavigateToLogin={() => setCurrentPage('login')}
            />
        case 'submit':
            return <SubmitAnalysis onBack={goHome} />
        case 'analysis':
            return <AnalysisHistory onBack={goHome} />
        case 'profile':
            return <Profile onBack={goHome} />
        case 'users':
            return <UserManagement onBack={goHome} />
        case 'dashboard':
        default:
            // הגנה: אם אין טוקן, אי אפשר להיות בדשבורד
            if (!token) {
                return <Login onLogin={handleAuthSuccess} onNavigateToRegister={() => setCurrentPage('register')} />
            }
            return (
                <Dashboard
                    onLogout={handleLogout}
                    onNavigateToSubmit={() => setCurrentPage('submit')}
                    onNavigateToAnalysis={() => setCurrentPage('analysis')}
                    onNavigateToProfile={() => setCurrentPage('profile')}
                    onNavigateToUsers={() => setCurrentPage('users')}
                />
            )
    }
}

export default App