interface Props {
    onLogout: () => void
    onNavigateToSubmit: () => void
    onNavigateToAnalysis: () => void
    onNavigateToProfile: () => void
    onNavigateToUsers: () => void
}

export default function Dashboard({
                                      onLogout,
                                      onNavigateToSubmit,
                                      onNavigateToAnalysis,
                                      onNavigateToProfile,
                                      onNavigateToUsers
                                  }: Props) {

    return (
        <>
            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #f0f4f8 0%, #ffffff 100%);
          color: #1a202c;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .navbar {
          background: #ffffff;
          color: #1a202c;
          padding: 0.75rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-icon {
          width: 32px;
          height: 32px;
          background-color: #f1f5f9;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #2563eb;
          font-size: 1rem;
          border: 1px solid #e2e8f0;
        }

        .brand-text h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
        }

        .brand-text p {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: -1px;
        }

        .logout-btn {
          background: transparent;
          color: #64748b;
          border: 1px solid transparent;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          color: #ef4444;
          background: #fee2e2;
        }

        .main-content {
          padding: 2.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1.25rem;
          margin-top: 1.5rem;
        }

        /* --- Quick Actions section --- */
        .primary-action-card {
          background: #2563eb;
          color: white;
          padding: 1.5rem 2rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
          cursor: pointer;
          transition: transform 0.2s;
          position: relative;
        }

        .primary-action-card:hover {
          transform: translateY(-2px);
          background: #1d4ed8;
        }

        .primary-action-icon {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .primary-action-icon svg { width: 24px; height: 24px; fill: white; }

        .primary-action-text h3 { font-size: 1rem; font-weight: 600; }
        .primary-action-text p { font-size: 0.875rem; opacity: 0.9; margin-top: 0.15rem; }

        /* --- Navigation cards grid --- */
        .nav-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .nav-card {
          background: white;
          padding: 1.25rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-card:hover {
          background: #f8fafc;
          border-color: #2563eb;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .nav-icon {
          width: 36px;
          height: 36px;
          background: #f1f5f9;
          color: #2563eb;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
        }

        .nav-text h3 { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
        .nav-text p { font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; }

        /* --- Overview/Stats cards grid --- */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          border: 1px solid #e2e8f0;
        }

        .stat-title {
          color: #64748b;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .stat-value {
          font-size: 2.25rem;
          font-weight: 700;
          margin-top: 0.5rem;
        }

        .stat-value.blue { color: #2563eb; }
        .stat-value.orange { color: #f59e0b; }
        .stat-value.green { color: #166534; }
      `}</style>

            <div className="dashboard-container">
                <nav className="navbar">
                    <div className="brand">
                        <div className="brand-icon">
                            C
                        </div>
                        <div className="brand-text">
                            <h2>Construction Compliance</h2>
                            <p>Welcome, admin</p>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={onLogout}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Logout
                    </button>
                </nav>

                <main className="main-content">
                    <section>
                        <h2 className="section-title">Quick Actions</h2>
                        <div className="primary-action-card" onClick={onNavigateToSubmit}>
                            <div className="primary-action-icon">
                                <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM12 18l-3-3h2v-4h2v4h2l-3 3z"/></svg>
                            </div>
                            <div className="primary-action-text">
                                <h3>Upload New Analysis</h3>
                                <p>Submit before and after images for AI analysis</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="section-title">Navigation</h2>
                        <div className="nav-grid">
                            {/* הוספתי את הלחיצה כאן */}
                            <div className="nav-card" onClick={onNavigateToAnalysis}>
                                <div className="nav-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                </div>
                                <div className="nav-text">
                                    <h3>Analysis History</h3>
                                    <p>View all submitted analyses and results</p>
                                </div>
                            </div>
                            {/* הוספתי את הלחיצה כאן */}
                            <div className="nav-card" onClick={onNavigateToProfile}>
                                <div className="nav-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </div>
                                <div className="nav-text">
                                    <h3>Profile</h3>
                                    <p>Manage your account settings</p>
                                </div>
                            </div>
                            {/* הוספתי את הלחיצה כאן */}
                            <div className="nav-card" onClick={onNavigateToUsers}>
                                <div className="nav-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </div>
                                <div className="nav-text">
                                    <h3>User Management</h3>
                                    <p>Manage users and permissions</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="section-title">Overview</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-title">Total Analyses</div>
                                <div className="stat-value blue">24</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-title">Pending Results</div>
                                <div className="stat-value orange">3</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-title">Completed This Week</div>
                                <div className="stat-value green">7</div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    )
}