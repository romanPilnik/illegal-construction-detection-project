import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { PasswordInput } from './PasswordInput'

function ControlledPasswordInput() {
  const [value, setValue] = useState('')
  return <PasswordInput id="password" label="Password" value={value} onChange={setValue} />
}

describe('PasswordInput', () => {
  it('updates its value and toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<ControlledPasswordInput />)

    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
    expect(screen.queryByRole('button', { name: 'Show password' })).not.toBeInTheDocument()

    await user.type(input, 'secret')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })
})
