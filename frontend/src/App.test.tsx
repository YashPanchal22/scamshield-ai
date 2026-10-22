import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Landing from './pages/Landing'
import { analyzeTextLocal, analyzeUrlLocal } from './services/localEngine'
import { redactSensitive } from './lib/store'
import { HighlightedText } from './components/Results'

describe('Landing page', () => {
  it('shows the required hero headline and working CTAs', () => {
    const { getByText, getAllByRole } = render(<MemoryRouter><Landing /></MemoryRouter>)
    expect(getByText(/One Click Can Change Everything/)).toBeInTheDocument()
    const links = getAllByRole('link')
    expect(links.some((a: HTMLElement) => a.getAttribute('href') === '/scan')).toBe(true)
    expect(links.some((a: HTMLElement) => /Try Live Demo/i.test(a.textContent || ''))).toBe(true)
  })
})

describe('On-device fallback engine (mirrors backend rules)', () => {
  it('flags the fake-bank OTP scenario as high risk', () => {
    const r = analyzeTextLocal('Dear customer, your SBI account will be blocked within 2 hours. Update your KYC immediately and share the OTP to verify.')
    expect(r.risk_level).toBe('high')
    expect(r.signals.map((s) => s.rule_id)).toContain('OTP_REQUEST')
  })

  it('keeps a routine appointment reminder low risk', () => {
    const r = analyzeTextLocal('Hello, your clinic appointment is tomorrow at 10:30 AM. Please arrive 10 minutes early.')
    expect(r.risk_level).toBe('low')
    expect(r.summary).toMatch(/never guarantee/i)
  })

  it('does not slam a genuine OTP-delivery message as high risk', () => {
    const r = analyzeTextLocal('Your OTP for login is 482910. Do not share it with anyone.')
    expect(r.risk_level).toBe('low')
    expect(r.signals.map((s) => s.rule_id)).not.toContain('OTP_REQUEST')
  })

  it('detects IP-host and shortener URL risks', () => {
    expect(analyzeUrlLocal('http://192.168.1.5/login').findings.map((f) => f.rule_id)).toContain('URL_IP_HOST')
    expect(analyzeUrlLocal('https://bit.ly/prize').findings.map((f) => f.rule_id)).toContain('URL_SHORTENER')
  })
})

describe('Privacy redaction', () => {
  it('redacts phone numbers and OTPs before sharing', () => {
    const out = redactSensitive('Call me on 9876543210, OTP is 482910, mail [email protected]')
    expect(out).not.toContain('9876543210')
    expect(out).not.toContain('482910')
    expect(out).toContain('[PHONE REDACTED]')
  })
})

describe('HighlightedText (XSS-safe evidence)', () => {
  it('renders suspicious phrases as marks and raw HTML as inert text', () => {
    render(<HighlightedText text={'Share the OTP <script>alert(1)</script> now'} phrases={['Share the OTP']} />)
    expect(document.querySelector('mark')).not.toBeNull()
    expect(document.querySelector('script')).toBeNull()
  })
})
