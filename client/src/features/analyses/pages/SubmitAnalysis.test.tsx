import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAnalysisMock = vi.hoisted(() => vi.fn())
vi.mock('../api', () => ({ createAnalysis: createAnalysisMock }))

import SubmitAnalysis from './SubmitAnalysis'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/submit']}>
      <Routes>
        <Route path="/submit" element={<SubmitAnalysis />} />
        <Route path="/analyses/:id" element={<p>analysis detail</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function uploadBothImages(user: ReturnType<typeof userEvent.setup>) {
  const before = new File(['before'], 'before.png', { type: 'image/png' })
  const after = new File(['after'], 'after.png', { type: 'image/png' })
  await user.upload(document.querySelector('#submit-before-file') as HTMLInputElement, before)
  await user.upload(document.querySelector('#submit-after-file') as HTMLInputElement, after)
}

describe('SubmitAnalysis', () => {
  beforeEach(() => createAnalysisMock.mockReset())

  it('keeps submission disabled until both files are selected', async () => {
    const user = userEvent.setup()
    renderPage()
    const submit = screen.getByRole('button', { name: 'Submit for Analysis' })

    expect(submit).toBeDisabled()
    await user.upload(
      document.querySelector('#submit-before-file') as HTMLInputElement,
      new File(['before'], 'before.png', { type: 'image/png' }),
    )
    expect(submit).toBeDisabled()
  })

  it('requires a title once both images are present', async () => {
    const user = userEvent.setup()
    renderPage()
    await uploadBothImages(user)

    expect(screen.getByText('Enter a request title to enable submission.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Submit for Analysis' }))

    expect(screen.getByText('Please enter a request title.')).toBeInTheDocument()
    expect(createAnalysisMock).not.toHaveBeenCalled()
  })

  it('submits the expected form data and navigates to the result', async () => {
    const user = userEvent.setup()
    createAnalysisMock.mockResolvedValue({ data: { id: 'analysis-42' } })
    renderPage()
    await uploadBothImages(user)
    await user.type(screen.getByLabelText('Request Title'), '  Main Street check  ')

    await user.click(screen.getByRole('button', { name: 'Submit for Analysis' }))

    expect(await screen.findByText('analysis detail')).toBeInTheDocument()
    const formData = createAnalysisMock.mock.calls[0]?.[0] as FormData
    expect((formData.get('beforeImage') as File).name).toBe('before.png')
    expect((formData.get('afterImage') as File).name).toBe('after.png')
    expect(formData.get('request_title')).toBe('Main Street check')
  })

})
