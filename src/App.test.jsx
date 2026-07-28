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
    expect(screen.getAllByText('+27 63 667 0985').length).toBeGreaterThan(0)
    expect(
      screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href')?.includes('wa.me'))
        .every((link) => link.getAttribute('href') === 'https://wa.me/27636670985'),
    ).toBe(true)
    expect(document.body).not.toHaveTextContent('+27 61 188 36379')
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

  it('provides four related mining videos and navigable project albums', () => {
    const { container } = render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /play machines below ground/i }))
    let dialog = screen.getByRole('dialog', { name: /machines below ground/i })
    expect(within(dialog).getAllByRole('button', { name: /^play /i })).toHaveLength(4)
    expect(dialog.querySelector('source')).toHaveAttribute(
      'src',
      'https://videos.pexels.com/video-files/31752064/13527815_3840_2160_25fps.mp4',
    )

    fireEvent.click(within(dialog).getByRole('button', { name: /play fleet in motion/i }))
    expect(dialog.querySelector('source')).toHaveAttribute(
      'src',
      'https://videos.pexels.com/video-files/8382433/8382433-hd_1280_720_30fps.mp4',
    )
    fireEvent.click(within(dialog).getByRole('button', { name: /close gallery item/i }))

    fireEvent.click(screen.getByRole('button', { name: 'Steel Fabrication' }))
    fireEvent.click(screen.getByRole('button', { name: /open precision fabrication/i }))
    dialog = screen.getByRole('dialog', { name: /precision fabrication/i })
    expect(within(dialog).getByAltText(/industrial worker welding steel beams/i)).toBeInTheDocument()
    expect(within(dialog).getAllByRole('button', { name: /^view image/i })).toHaveLength(4)

    fireEvent.click(within(dialog).getByRole('button', { name: /next album image/i }))
    expect(within(dialog).getByAltText(/worker in a hard hat welding metal components/i)).toBeInTheDocument()
    expect(container).not.toHaveTextContent('Heavy equipment readiness')
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
