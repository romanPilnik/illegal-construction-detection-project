interface Props {
    onBack: () => void
}

export default function Profile({ onBack }: Props) {
    return (
        <>
            <style>{`
        .profile-page { min-height: 100vh; background: #f0f4f8; font-family: 'Segoe UI', system-ui, sans-serif; padding-top: 2rem; }
        .page-header { max-width: 1000px; margin: 0 auto; margin-bottom: 2rem; }
        .main-title { font-size: 2rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; }
        .nav-header { background: white; padding: 1rem 2rem; display: flex; align-items: center; gap: 2rem; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .back-btn { background: none; border: none; color: #64748b; font-size: 0.875rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
        .back-btn:hover { color: #2563eb; }
        .header-text h2 { font-size: 1.125rem; font-weight: 700; color: #1e293b; }
        .header-text p { font-size: 0.75rem; color: #64748b; }
        .profile-container { max-width: 800px; margin: 2rem auto; display: flex; flex-direction: column; gap: 1.5rem; }
        .profile-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .card-header { margin-bottom: 1.5rem; }
        .card-header h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; color: #1e293b; }
        .card-header p { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
        .form-group label { display: block; font-size: 0.875rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; }
        .form-input { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; background: #f8fafc; color: #1e293b; }
        .form-input:focus { outline: none; border-color: #2563eb; background: white; }
        .form-input:read-only { color: #64748b; cursor: not-allowed; }
        .status-text { color: #166534; font-weight: 600; display: flex; align-items: center; gap: 0.25rem; }
        .btn-update { background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-update:hover { background: #1d4ed8; }
      `}</style>
            <div className="profile-page">
                <div className="page-header"><h1 className="main-title">Profile Page:</h1></div>
                <div className="nav-header">
                    <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
                    <div className="header-text"><h2>Profile Settings</h2><p>Manage your account information</p></div>
                </div>

                <div className="profile-container">
                    {/* כרטיסיית פרטי חשבון (לקריאה בלבד) */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h3>👤 Account Information</h3>
                            <p>Your basic account details</p>
                        </div>
                        <div className="form-grid">
                            <div className="form-group"><label>Username</label><input type="text" className="form-input" value="admin" readOnly /></div>
                            <div className="form-group"><label>Email</label><input type="email" className="form-input" value="admin@municipality.gov" readOnly /></div>
                            <div className="form-group"><label>Role</label><input type="text" className="form-input" value="Admin" readOnly /></div>
                            <div className="form-group"><label>Account Created</label><input type="text" className="form-input" value="June 15, 2024" readOnly /></div>
                        </div>
                        <div className="form-group"><label>Account Status</label><div className="status-text">✅ Active</div></div>
                    </div>

                    {/* כרטיסיית הגדרות אבטחה */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h3>🔒 Security Settings</h3>
                            <p>Change your password</p>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Current Password</label><input type="password" className="form-input" placeholder="Enter current password" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>New Password</label><input type="password" className="form-input" placeholder="Enter new password" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Confirm New Password</label><input type="password" className="form-input" placeholder="Confirm new password" />
                        </div>
                        <button className="btn-update">Update Password</button>
                    </div>
                </div>
            </div>
        </>
    )
}