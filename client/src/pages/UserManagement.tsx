interface Props {
    onBack: () => void
}

export default function UserManagement({ onBack }: Props) {
    const users = [
        { id: 1, user: 'admin', email: 'admin@municipality.gov', role: 'Admin', status: 'Active', created: '6/15/2024' },
        { id: 2, user: 'inspector_john', email: 'john@municipality.gov', role: 'Inspector', status: 'Active', created: '8/20/2024' },
        { id: 3, user: 'inspector_sarah', email: 'sarah@municipality.gov', role: 'Inspector', status: 'Active', created: '9/10/2024' },
        { id: 4, user: 'inspector_mike', email: 'mike@municipality.gov', role: 'Inspector', status: 'Inactive', created: '7/5/2024' },
        { id: 5, user: 'inspector_emma', email: 'emma@municipality.gov', role: 'Inspector', status: 'Active', created: '10/12/2024' },
    ];

    return (
        <>
            <style>{`
        .um-page { min-height: 100vh; background: #f0f4f8; font-family: 'Segoe UI', system-ui, sans-serif; padding-top: 2rem; }
        .page-header { max-width: 1100px; margin: 0 auto; margin-bottom: 2rem; }
        .main-title { font-size: 2rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; }
        .nav-header { background: white; padding: 1rem 2rem; display: flex; align-items: center; gap: 2rem; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .back-btn { background: none; border: none; color: #64748b; font-size: 0.875rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
        .back-btn:hover { color: #2563eb; }
        .header-text h2 { font-size: 1.125rem; font-weight: 700; color: #1e293b; }
        .header-text p { font-size: 0.75rem; color: #64748b; }
        .um-container { max-width: 1100px; margin: 2rem auto; }
        .um-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .card-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .card-title h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; color: #1e293b; }
        .card-title p { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }
        .btn-add { background: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
        .search-bar { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; margin-bottom: 1.5rem; outline: none; }
        .search-bar:focus { border-color: #2563eb; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { padding: 1rem; font-size: 0.875rem; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
        td { padding: 1rem; font-size: 0.875rem; color: #1e293b; border-bottom: 1px solid #e2e8f0; }
        .badge { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: 600; }
        .role-admin { background: #f3e8ff; color: #9333ea; }
        .role-inspector { background: #e0f2fe; color: #0284c7; }
        .status-active { color: #166534; font-weight: 600; }
        .status-inactive { color: #94a3b8; font-weight: 600; }
        .actions { color: #94a3b8; cursor: pointer; display: flex; gap: 0.75rem; }
        .actions span:hover { color: #ef4444; }
      `}</style>
            <div className="um-page">
                <div className="page-header"><h1 className="main-title">Admin UserManagement Page:</h1></div>
                <div className="nav-header">
                    <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
                    <div className="header-text"><h2>User Management</h2><p>Manage users and permissions</p></div>
                </div>

                <div className="um-container">
                    <div className="um-card">
                        <div className="card-header-flex">
                            <div className="card-title">
                                <h3>👥 All Users</h3>
                                <p>Manage user accounts and roles</p>
                            </div>
                            <button className="btn-add">+ Add User</button>
                        </div>
                        <input type="text" className="search-bar" placeholder="🔍 Search by username or email..." />

                        <table>
                            <thead>
                            <tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: 600 }}>{u.user}</td>
                                    <td>{u.email}</td>
                                    <td><span className={`badge ${u.role === 'Admin' ? 'role-admin' : 'role-inspector'}`}>{u.role}</span></td>
                                    <td><span className={u.status === 'Active' ? 'status-active' : 'status-inactive'}>{u.status}</span></td>
                                    <td>{u.created}</td>
                                    <td className="actions"><span>✏️</span> <span>🗑️</span></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    )
}