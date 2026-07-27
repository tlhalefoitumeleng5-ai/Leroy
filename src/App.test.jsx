import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Vikela Mining website', () => {
  it('renders the core company credentials and direct contact routes', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: /pioneering modern, sustainable mining & engineering/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/level 1 b-bbee/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/100% black female-owned/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Info@Vikelamining.co.za').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Admin@vikelamining.co.za').length).toBeGreaterThan(0)
  })

  it('opens and closes the quote inquiry dialog', () => {
    render(<App />)

    fireEvent.click(screen.getAllByRole('button', { name: /request a quote/i })[0])
    const dialog = screen.getByRole('dialog', { name: /tell us about the scope/i })
    expect(dialog).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: /close quote form/i }))
    expect(screen.queryByRole('dialog', { name: /tell us about the scope/i })).not.toBeInTheDocument()
  })

  it('switches service panels and filters the visual gallery', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('tab', { name: /engineering & equipment/i }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('HDPE & PTFE pipe systems')

    fireEvent.click(screen.getByRole('button', { name: 'Steel Fabrication' }))
    expect(screen.getByRole('button', { name: /open precision fabrication/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /open coordinated material movement/i })).not.toBeInTheDocument()
  })

  it('sends a validated contact inquiry through the configured service', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    render(<App />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Nomsa Dlamini' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'nomsa@example.com' } })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+27 82 555 0123' } })
    fireEvent.change(screen.getByLabelText(/^department/i), { target: { value: 'Admin & tenders' } })
    fireEvent.change(screen.getByLabelText(/service category/i), { target: { value: 'Mining & Underground' } })
    fireEvent.change(screen.getByLabelText(/project or inquiry details/i), {
      target: { value: 'Please contact us about an underground development tender.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send inquiry/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(await screen.findByText(/inquiry has been sent/i)).toBeInTheDocument()
  })
})
