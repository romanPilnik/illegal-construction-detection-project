interface Props {
    onBack: () => void
}

export default function AnalysisHistory({ onBack }: Props) {
    // נתוני דמי שכרגע נציג במסך (בהמשך נמשוך אותם מהשרת)
    const analyses = [
        { id: 1, status: 'Completed', date: '2026-01-04 14:32' },
        { id: 2, status: 'Completed', date: '2026-01-03 11:15' },
        { id: 3, status: 'Pending', date: '2026-01-03 09:45' },
        { id: 4, status: 'Completed', date: '2026-01-02 16:20' },
        { id: 5, status: 'Pending', date: '2026-01-01 13:10' },
    ];

    return (
        <>
            <style>{`
        .history-page { min-height: 100vh; background: #f0f4f8; font-family: 'Segoe UI', system-ui, sans-serif; padding-top: 2rem; }
        .page-header { max-width: 1000px; margin: 0 auto; margin-bottom: 2rem; }
        .main-title { font-size: 2rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; }
        .nav-header { background: white; padding: 1rem 2rem; display: flex; align-items: center; gap: 2rem; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .back-btn { background: none; border: none; color: #64748b; font-size: 0.875rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
        .back-btn:hover { color: #2563eb; }
        .header-text h2 { font-size: 1.125rem; font-weight: 700; color: #1e293b; }
        .header-text p { font-size: 0.75rem; color: #64748b; }
        .history-container { max-width: 1000px; margin: 2rem auto; }
        .history-list { display: flex; flex-direction: column; gap: 1rem; }
        .history-item { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.02); cursor: pointer; transition: border-color 0.2s; }
        .history-item:hover { border-color: #cbd5e1; }
        .item-left { display: flex; align-items: center; gap: 1.5rem; }
        .item-title { font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;}
        .item-icon { color: #3b82f6; }
        .badge { padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
        .badge.completed { background: #dcfce3; color: #166534; }
        .badge.pending { background: #fef3c7; color: #92400e; }
        .item-date { color: #64748b; font-size: 0.875rem; }
        .chevron { color: #94a3b8; }
      `}</style>
            <div className="history-page">
                <div className="page-header"><h1 className="main-title">Analysis Page:</h1></div>
                <div className="nav-header">
                    <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
                    <div className="header-text"><h2>Analysis History</h2><p>View all submitted analyses and results</p></div>
                </div>
                <div className="history-container">
                    <div className="history-list">
                        {analyses.map(item => (
                            <div key={item.id} className="history-item">
                                <div className="item-left">
                                    <div className="item-title"><span className="item-icon">📄</span> Analysis #{item.id}</div>
                                    <span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span>
                                    <span className="item-date">{item.date}</span>
                                </div>
                                <div className="chevron">⌄</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}