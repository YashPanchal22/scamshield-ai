import { useState } from 'react'
import { LifeBuoy, PhoneCall, ExternalLink, CheckCircle2, Wallet, KeyRound, FileWarning, MonitorSmartphone, MousePointerClick, UserX, Info } from 'lucide-react'

interface Scenario {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  urgency: string
  intro: string
  steps: string[]
}

const SCENARIOS: Scenario[] = [
  {
    id: 'money', icon: Wallet, title: 'I transferred money to a scammer', urgency: 'Act in minutes — speed decides recovery chances',
    intro: 'Banks can sometimes hold/interdict a fraudulent transfer if reported immediately. Do these in order, right now:',
    steps: [
      'Call the cyber-fraud helpline 1930 (India) immediately and note the complaint/acknowledgement number.',
      'Call your bank / payment app using the official number (back of card / official app) and request a transaction hold/freeze on the beneficiary side.',
      'Preserve evidence: screenshots of chats, transaction IDs (UTR), scammer phone number, UPI ID, and any links.',
      'File a detailed report at cybercrime.gov.in and upload the evidence.',
      'Visit your bank branch with the complaint copy if the amount is large.',
      'Do NOT pay any "recovery agent" who promises to get money back for a fee — that is a second scam.',
    ],
  },
  {
    id: 'otp', icon: KeyRound, title: 'I shared an OTP / password / PIN', urgency: 'Treat the account as compromised',
    intro: 'An OTP or password in the wrong hands can be used within minutes. Lock things down:',
    steps: [
      'Call your bank immediately and ask them to block cards/net-banking and watch for transactions.',
      'From a different, trusted device, change the compromised password/PIN and enable two-factor authentication.',
      'Revoke unknown sessions/devices in your banking and email accounts ("log out of all devices").',
      'Check recent statements for small "test" transactions and report anything unknown.',
      'Call 1930 (India) and file a report at cybercrime.gov.in if any money moved.',
      'Never share OTPs again — real bank staff never ask for them.',
    ],
  },
  {
    id: 'docs', icon: FileWarning, title: 'I shared personal documents (Aadhaar/PAN/photos)', urgency: 'Reduce identity-misuse risk',
    intro: 'Documents can be misused for fake loans, SIMs, or accounts. Limit the damage:',
    steps: [
      'Note exactly what was shared, with whom, and when; keep chat/call evidence.',
      'For Aadhaar: consider locking biometrics via the official UIDAI/mAadhaar channel; use masked Aadhaar in future.',
      'Alert your bank that your KYC documents may be misused; ask for extra verification on your accounts.',
      'Monitor your credit report periodically for loans/cards you did not apply for.',
      'File a report at cybercrime.gov.in describing the disclosure.',
      'In future, share documents only through official apps/portals — never over WhatsApp to strangers.',
    ],
  },
  {
    id: 'app', icon: MonitorSmartphone, title: 'I installed AnyDesk / a suspicious app', urgency: 'Isolate the device first',
    intro: 'Remote-access apps let scammers see your screen and OTPs. Act before using banking apps again:',
    steps: [
      'Disconnect the phone from the internet (airplane mode) and uninstall the app immediately.',
      'From a different trusted device, call your bank to block transactions and change passwords/PINs.',
      'Check for other unknown apps and remove them; review app permissions (Accessibility, SMS access).',
      'Run a scan with a reputable antivirus; consider a factory reset if anything looks persistent.',
      'Monitor accounts closely for 2–4 weeks and report unknown activity at once.',
      'Report the incident: 1930 / cybercrime.gov.in (India).',
    ],
  },
  {
    id: 'link', icon: MousePointerClick, title: 'I opened a suspicious link', urgency: 'Depends on what you entered',
    intro: 'Merely opening a page is lower risk; entering details is the danger point:',
    steps: [
      'If you entered nothing: close the tab, clear that site\'s cookies, and monitor your accounts.',
      'If you entered a password: change it immediately from a trusted device and enable 2FA everywhere it was reused.',
      'If you entered card/banking details or an OTP: call your bank now and follow the OTP-shared checklist.',
      'If a file downloaded: do not open it; delete it and run an antivirus scan.',
      'Never re-open the link "to check" — use ScamShield\'s URL inspector instead.',
      'Report phishing links at cybercrime.gov.in (India).',
    ],
  },
  {
    id: 'access', icon: UserX, title: 'Someone accessed my account', urgency: 'Reclaim and lock the account',
    intro: 'Unknown logins, changed details, or messages you didn\'t send mean active compromise:',
    steps: [
      'Use the provider\'s official account-recovery flow from a trusted device; change the password to a unique one.',
      'Revoke all active sessions and connected third-party apps you don\'t recognize.',
      'Enable two-factor authentication (prefer an authenticator app over SMS where possible).',
      'Check linked bank/payment accounts for unauthorized activity and alert your bank.',
      'Warn your contacts — compromised accounts are used to scam friends and family.',
      'Report at cybercrime.gov.in / call 1930 (India) if money or identity misuse is involved.',
    ],
  },
]

export default function Emergency() {
  const [active, setActive] = useState('money')
  const [done, setDone] = useState<Set<string>>(new Set())
  const scenario = SCENARIOS.find((s) => s.id === active)!

  const toggle = (key: string) => setDone((prev) => { const n = new Set(prev); if (n.has(key)) { n.delete(key) } else { n.add(key) } return n })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white"><LifeBuoy className="h-8 w-8 text-rose-500" /> Emergency &amp; Recovery Center</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Pick what happened and work through the checklist. ScamShield provides guidance only — we <strong>cannot</strong> freeze accounts, recover money, or file reports for you. Your bank and official authorities can.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <a href="tel:1930" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-3 font-extrabold text-white shadow-xl shadow-rose-500/25 transition hover:brightness-110"><PhoneCall className="h-5 w-5" /> Call Cyber-Fraud Helpline: 1930</a>
        <a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 font-bold text-rose-700 transition hover:bg-rose-500/20 dark:text-rose-300">cybercrime.gov.in <ExternalLink className="h-4 w-4" /></a>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <nav className="space-y-2" aria-label="Emergency scenarios">
          {SCENARIOS.map((s) => (
            <button key={s.id} onClick={() => setActive(s.id)} aria-pressed={active === s.id}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-bold transition ${active === s.id ? 'border-rose-500/50 bg-rose-500/12 text-rose-700 dark:text-rose-200' : 'glass text-slate-700 hover:border-rose-400/40 dark:text-slate-200'}`}>
              <s.icon className="h-5 w-5 shrink-0 text-rose-500" /> {s.title}
            </button>
          ))}
        </nav>

        <section className="glass glow-ring rounded-[1.75rem] p-5 sm:p-7" aria-live="polite">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{scenario.title}</h2>
          <p className="mt-1 inline-block rounded-full bg-rose-500/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-rose-600 dark:text-rose-300">{scenario.urgency}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{scenario.intro}</p>
          <ol className="mt-4 space-y-2.5">
            {scenario.steps.map((step, i) => {
              const key = `${scenario.id}-${i}`
              const isDone = done.has(key)
              return (
                <li key={key}>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed transition ${isDone ? 'border-emerald-500/40 bg-emerald-500/10 text-slate-500 line-through dark:text-slate-400' : 'border-sky-500/15 bg-slate-900/[0.03] text-slate-700 dark:bg-white/[0.04] dark:text-slate-200'}`}>
                    <input type="checkbox" checked={isDone} onChange={() => toggle(key)} className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-500" aria-label={`Mark step ${i + 1} done`} />
                    <span><strong className="mr-1.5 not-italic">Step {i + 1}.</strong>{step}</span>
                    {isDone && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-500 no-underline" aria-hidden="true" />}
                  </label>
                </li>
              )
            })}
          </ol>
          <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Progress: {scenario.steps.filter((_, i) => done.has(`${scenario.id}-${i}`)).length}/{scenario.steps.length} steps completed
          </p>
        </section>
      </div>

      <p className="flex items-start gap-2 rounded-2xl border border-sky-500/25 bg-sky-500/[0.07] px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
        Always contact banks and providers through verified official channels (official app, number on your card, or branch) — never through numbers sent in suspicious messages or found via random search ads.
      </p>
    </div>
  )
}
