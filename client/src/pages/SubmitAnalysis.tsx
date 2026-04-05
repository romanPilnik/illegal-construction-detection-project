import { useState, useRef } from 'react'

interface Props {
    onBack: () => void // הפונקציה שתחזיר אותנו לדשבורד
}

export default function SubmitAnalysis({ onBack }: Props) {
    const [beforeImage, setBeforeImage] = useState<File | null>(null)
    const [afterImage, setAfterImage] = useState<File | null>(null)

    // רפרנסים לשדות הנסתרים של בחירת הקבצים
    const beforeInputRef = useRef<HTMLInputElement>(null)
    const afterInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = () => {
        alert('Images submitted for AI analysis!')
        // כאן בהמשך נכתוב את הקוד ששולח את התמונות לשרת
    }

    return (
        <>
            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .submit-page {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Segoe UI', system-ui, sans-serif;
          padding-top: 2rem;
        }

        .page-header {
          max-width: 1000px;
          margin: 0 auto;
          margin-bottom: 2rem;
        }

        .main-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1.5rem;
        }

        .nav-header {
          background: white;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }

        .back-btn {
          background: none;
          border: none;
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .back-btn:hover { color: #2563eb; }

        .header-text h2 { font-size: 1.125rem; font-weight: 700; color: #1e293b; }
        .header-text p { font-size: 0.75rem; color: #64748b; }

        .upload-container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }

        .upload-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .image-box {
          display: flex;
          flex-direction: column;
        }

        .box-title {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .drop-area {
          background: #eff6ff;
          border-radius: 12px 12px 0 0;
          height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-bottom: none;
        }

        .upload-icon {
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          margin-bottom: 1rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .drop-area p { font-size: 0.875rem; font-weight: 600; color: #1e293b; }
        .drop-area span { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }

        .upload-btn {
          width: 100%;
          padding: 1rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 0 0 12px 12px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .upload-btn:hover { background: #1d4ed8; }

        .submit-all-btn {
          width: 100%;
          padding: 1rem;
          background: #94a3b8;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: not-allowed;
          transition: background 0.2s;
        }

        .submit-all-btn.active {
          background: #2563eb;
          cursor: pointer;
        }
        
        .submit-all-btn.active:hover { background: #1d4ed8; }

        .hidden-input { display: none; }
      `}</style>

            <div className="submit-page">
                <div className="page-header">
                    <h1 className="main-title">Image Submission:</h1>
                </div>

                <div className="nav-header">
                    {/* כפתור החזרה לדשבורד */}
                    <button className="back-btn" onClick={onBack}>
                        ← Back to Dashboard
                    </button>
                    <div className="header-text">
                        <h2>Submit Analysis</h2>
                        <p>Upload before and after images</p>
                    </div>
                </div>

                <div className="upload-container">
                    <div className="upload-grid">
                        {/* אזור תמונת הלפני */}
                        <div className="image-box">
                            <div className="box-title">Before Image</div>
                            <div className="drop-area">
                                <div className="upload-icon">↑</div>
                                <p>{beforeImage ? beforeImage.name : 'No image uploaded'}</p>
                                <span>Upload the initial state image</span>
                            </div>
                            <button className="upload-btn" onClick={() => beforeInputRef.current?.click()}>
                                ↑ Upload Before Image
                            </button>
                            <input
                                type="file"
                                className="hidden-input"
                                ref={beforeInputRef}
                                onChange={(e) => setBeforeImage(e.target.files?.[0] || null)}
                                accept="image/*"
                            />
                        </div>

                        {/* אזור תמונת האחרי */}
                        <div className="image-box">
                            <div className="box-title">After Image</div>
                            <div className="drop-area">
                                <div className="upload-icon">↑</div>
                                <p>{afterImage ? afterImage.name : 'No image uploaded'}</p>
                                <span>Upload the current state image</span>
                            </div>
                            <button className="upload-btn" onClick={() => afterInputRef.current?.click()}>
                                ↑ Upload After Image
                            </button>
                            <input
                                type="file"
                                className="hidden-input"
                                ref={afterInputRef}
                                onChange={(e) => setAfterImage(e.target.files?.[0] || null)}
                                accept="image/*"
                            />
                        </div>
                    </div>

                    {/* כפתור השליחה שנדלק רק כששתי התמונות נבחרו */}
                    <button
                        className={`submit-all-btn ${beforeImage && afterImage ? 'active' : ''}`}
                        disabled={!beforeImage || !afterImage}
                        onClick={handleSubmit}
                    >
                        Submit for Analysis
                    </button>
                </div>
            </div>
        </>
    )
}