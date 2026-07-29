import { API_BASE_URL } from '../../services/api'
import type { ExportFormat } from './types'

/**
 * Cross-origin <a download> is unreliable (especially for .xlsx).
 * Fetch the report as a blob and trigger a same-origin object URL download.
 */
export async function downloadExportFile(
  downloadUrl: string,
  format: ExportFormat,
  baseName: string
): Promise<void> {
  let absoluteUrl = downloadUrl
  try {
    // If API returned a relative path, resolve against API origin.
    absoluteUrl = new URL(downloadUrl, API_BASE_URL.replace(/\/api\/v1\/?$/, '/')).href
  } catch {
    absoluteUrl = downloadUrl
  }

  // Prefer https when page is https but URL came back as http (Render proxy).
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    absoluteUrl.startsWith('http://')
  ) {
    absoluteUrl = `https://${absoluteUrl.slice('http://'.length)}`
  }

  const response = await fetch(absoluteUrl)
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`)
  }

  const blob = await response.blob()
  const extension = format === 'EXCEL' ? 'xlsx' : 'pdf'
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = `${baseName}.${extension}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
