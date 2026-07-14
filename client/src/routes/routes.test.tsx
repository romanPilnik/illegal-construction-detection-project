import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AdminRoute } from './AdminRoute'
import { GuestRoute } from './GuestRoute'
import { RequireAuth } from './RequireAuth'

function renderRoutes(guard: ReactElement, initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={guard}>
          <Route path={initialPath} element={<p>protected destination</p>} />
        </Route>
        <Route path="/" element={<p>home destination</p>} />
        <Route path="/login" element={<p>login destination</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('route guards', () => {
  it('redirects an unauthenticated user to login', () => {
    renderRoutes(<RequireAuth />, '/private')
    expect(screen.getByText('login destination')).toBeInTheDocument()
  })

  it('allows an authenticated user through', () => {
    localStorage.setItem('token', 'token')
    renderRoutes(<RequireAuth />, '/private')
    expect(screen.getByText('protected destination')).toBeInTheDocument()
  })

  it('redirects authenticated users away from guest routes', () => {
    localStorage.setItem('token', 'token')
    renderRoutes(<GuestRoute />, '/login-only')
    expect(screen.getByText('home destination')).toBeInTheDocument()
  })

  it('allows unauthenticated users through guest routes', () => {
    renderRoutes(<GuestRoute />, '/login-only')
    expect(screen.getByText('protected destination')).toBeInTheDocument()
  })

  it('allows admins and redirects other or malformed users', () => {
    localStorage.setItem('user', JSON.stringify({ id: '1', username: 'A', role: 'Admin' }))
    const { unmount } = renderRoutes(<AdminRoute />, '/admin')
    expect(screen.getByText('protected destination')).toBeInTheDocument()
    unmount()

    localStorage.setItem('user', '{')
    renderRoutes(<AdminRoute />, '/admin')
    expect(screen.getByText('home destination')).toBeInTheDocument()
  })
})
