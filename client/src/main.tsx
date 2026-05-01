import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { API_BASE_URL } from './services/api'

const OBSERVABILITY_ENABLED =
  import.meta.env.VITE_OBSERVABILITY_LOGS !== 'false'

const logClientDeploymentDiagnostics = async () => {
  if (!OBSERVABILITY_ENABLED) return

  const healthUrl = `${API_BASE_URL}/health`
  console.info('[client] Boot diagnostics', {
    mode: import.meta.env.MODE,
    apiBaseUrl: API_BASE_URL,
    healthUrl,
  })

  try {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 8000)
    const response = await fetch(healthUrl, { signal: controller.signal })
    window.clearTimeout(timeout)

    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    console.info('[client] API health probe', {
      status: response.status,
      ok: response.ok,
      payload,
    })
  } catch (error) {
    console.error('[client] API health probe failed', error)
  }
}

void logClientDeploymentDiagnostics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
