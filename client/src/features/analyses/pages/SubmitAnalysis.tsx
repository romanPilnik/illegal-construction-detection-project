import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SubmitAnalysis() {
    const navigate = useNavigate()
    const [beforeImage, setBeforeImage] = useState<File | null>(null)
    const [afterImage, setAfterImage] = useState<File | null>(null)

    const beforeInputRef = useRef<HTMLInputElement>(null)
    const afterInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = () => {
        alert('Images submitted for AI analysis!')
    }

    const canSubmit = Boolean(beforeImage && afterImage)

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-8 [font-family:'Segoe_UI',system-ui,sans-serif]">
            <div className="mx-auto mb-8 max-w-[1000px]">
                <h1 className="mb-6 text-[2rem] font-bold text-[#1e293b]">Image Submission:</h1>
            </div>

            <div className="flex items-center gap-8 border-b border-t border-[#e2e8f0] bg-white px-8 py-4">
                <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2 border-none bg-transparent text-sm font-semibold text-[#64748b] hover:text-[#2563eb]"
                    onClick={() => navigate('/')}
                >
                    ← Back to Dashboard
                </button>
                <div>
                    <h2 className="text-lg font-bold text-[#1e293b]">Submit Analysis</h2>
                    <p className="text-xs text-[#64748b]">Upload before and after images</p>
                </div>
            </div>

            <div className="mx-auto max-w-[1000px] rounded-xl bg-white p-8 shadow-[0_4px_6px_rgba(0,0,0,0.02)]">
                <div className="mb-8 grid grid-cols-2 gap-8">
                    <div className="flex flex-col">
                        <div className="mb-4 font-semibold text-[#1e293b]">Before Image</div>
                        <div className="flex h-[300px] flex-col items-center justify-center rounded-t-xl border border-b-0 border-[#e2e8f0] bg-[#eff6ff]">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#3b82f6] shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                                ↑
                            </div>
                            <p className="text-sm font-semibold text-[#1e293b]">
                                {beforeImage ? beforeImage.name : 'No image uploaded'}
                            </p>
                            <span className="mt-1 text-xs text-[#64748b]">Upload the initial state image</span>
                        </div>
                        <button
                            type="button"
                            className="w-full cursor-pointer rounded-b-xl border-none bg-[#2563eb] p-4 font-semibold text-white hover:bg-[#1d4ed8]"
                            onClick={() => beforeInputRef.current?.click()}
                        >
                            ↑ Upload Before Image
                        </button>
                        <input
                            type="file"
                            className="hidden"
                            ref={beforeInputRef}
                            onChange={(e) => setBeforeImage(e.target.files?.[0] || null)}
                            accept="image/*"
                        />
                    </div>

                    <div className="flex flex-col">
                        <div className="mb-4 font-semibold text-[#1e293b]">After Image</div>
                        <div className="flex h-[300px] flex-col items-center justify-center rounded-t-xl border border-b-0 border-[#e2e8f0] bg-[#eff6ff]">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#3b82f6] shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                                ↑
                            </div>
                            <p className="text-sm font-semibold text-[#1e293b]">
                                {afterImage ? afterImage.name : 'No image uploaded'}
                            </p>
                            <span className="mt-1 text-xs text-[#64748b]">Upload the current state image</span>
                        </div>
                        <button
                            type="button"
                            className="w-full cursor-pointer rounded-b-xl border-none bg-[#2563eb] p-4 font-semibold text-white hover:bg-[#1d4ed8]"
                            onClick={() => afterInputRef.current?.click()}
                        >
                            ↑ Upload After Image
                        </button>
                        <input
                            type="file"
                            className="hidden"
                            ref={afterInputRef}
                            onChange={(e) => setAfterImage(e.target.files?.[0] || null)}
                            accept="image/*"
                        />
                    </div>
                </div>

                <button
                    type="button"
                    className={`w-full rounded-lg border-none p-4 font-semibold text-white transition-colors duration-200 ${
                        canSubmit
                            ? 'cursor-pointer bg-[#2563eb] hover:bg-[#1d4ed8]'
                            : 'cursor-not-allowed bg-[#94a3b8]'
                    }`}
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                >
                    Submit for Analysis
                </button>
            </div>
        </div>
    )
}
