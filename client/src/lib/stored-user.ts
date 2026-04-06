export type StoredUser = {
  id: string
  username: string
  role: string
  email?: string
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function clearAuthStorage(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
