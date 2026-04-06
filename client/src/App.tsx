import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import Dashboard from './features/dashboard/pages/Dashboard'
import SubmitAnalysis from './features/analyses/pages/SubmitAnalysis'
import Profile from './features/users/pages/Profile'
import UserManagement from './features/users/pages/UserManagement'
import AnalysisHistory from './features/analyses/pages/AnalysisHistory'
import AnalysisDetail from './features/analyses/pages/AnalysisDetail'
import AuditLogs from './features/audit-logs/pages/AuditLogs'
import { RequireAuth } from './routes/RequireAuth'
import { GuestRoute } from './routes/GuestRoute'
import { AdminRoute } from './routes/AdminRoute'

function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/analyses" element={<AnalysisHistory />} />
        <Route path="/analyses/:analysisId" element={<AnalysisDetail />} />
        <Route path="/submit" element={<SubmitAnalysis />} />

        <Route element={<AdminRoute />}>
          <Route path="/users" element={<UserManagement />} />
          <Route path="/logs" element={<AuditLogs />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
