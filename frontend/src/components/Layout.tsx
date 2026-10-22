import { useEffect, useState } from 'react'
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import {
  ShieldCheck, LayoutDashboard, ScanSearch, MessageCircleHeart, LifeBuoy,
  GraduationCap, History, Settings as SettingsIcon, BarChart3, Users,
  Menu, X, Sun, Moon, ExternalLink, PhoneCall,
} from 'lucide-react'
import { useSettings } from '../lib/store'
import { apiHealth } from '../services/api'

export function ShieldLogo({ size = 38 }: { size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center" aria-hidden="true">
      <span className="pulse-ring absolute inset-0 rounded-2xl bg-cyan-400/30" />
      <span className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-500 shadow-lg shadow-cyan-500/30" style={{ width: size, height: size }}>
        <ShieldCheck className="text-white" style={{ width: size * 0.62, height: size * 0.62 }} />
      </span>
    </span>
  )
}

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scan', label: 'Scam Scanner', icon: ScanSearch },
  { to: '/assistant', label: 'Safety Assistant', icon: MessageCircleHeart },
  { to: '/emergency', label: 'Emergency Help', icon: LifeBuoy },
  { to: '/intel', label: 'Scam Intelligence', icon: BarChart3 },
  { to: '/learn', label: 'Learn & Quiz', icon: GraduationCap },
  { to: '/family', label: 'Family Protection', icon: Users },
  { to: '/history', label: 'Scan History', icon: History },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Layout() {
  const { settings, update } = useSettings()
  const [open, setOpen] = useState(false)
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const location = useLocation()

  useEffect(() => { setOpen(false) }, [location.pathname])
  useEffect(() => { apiHealth().then((h) => setApiOk(h.ok)) }, [])

  const toggleTheme = () => {
    const next = { ...settings, theme: settings.theme === 'dark' ? ('light' as const) : ('dark' as const) }
    update(next)
  }

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
      isActive
        ? 'bg-gradient-to-r from-cyan-500/25 to-violet-500/20 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)] dark:text-cyan-300'
        : 'text-slate-600 hover:bg-sky-500/10 hover:text-sky-700 dark:text-slate-300 dark:hover:text-cyan-200'
    }`

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-3 px-5 pt-6 pb-5" aria-label="ScamShield AI home">
        <ShieldLogo />
        <span>
          <span className="block text-[17px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
            ScamShield <span className="text-gradient">AI</span>
          </span>
          <span className="block text-[10.5px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">Digital Scam Protector</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Main navigation">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={linkCls}>
            <n.icon className="h-[18px] w-[18px] shrink-0" /> {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 p-4">
        <div className="glass rounded-2xl p-3.5 text-xs" role="status">
          <p className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
            <span className={`h-2 w-2 rounded-full ${apiOk === null ? 'bg-amber-400' : apiOk ? 'bg-emerald-400' : 'bg-rose-400'}`} aria-hidden="true" />
            {apiOk === null ? 'Checking detection engine…' : apiOk ? 'Detection engine: Online' : 'Engine: On-device fallback'}
          </p>
          <p className="mt-1 leading-relaxed text-slate-500 dark:text-slate-400">
            {apiOk ? 'FastAPI backend connected.' : 'Backend unreachable — analysis runs locally in your browser and is labelled as such.'}
          </p>
        </div>
        <a href="tel:1930" className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition hover:brightness-110">
          <PhoneCall className="h-4 w-4" /> Fraud Helpline: 1930
        </a>
      </div>
    </div>
  )

  return (
    <div className="grid-bg min-h-screen bg-slate-50 text-slate-800 dark:bg-[#04070f] dark:text-slate-200">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] border-r border-sky-500/10 bg-white/70 backdrop-blur-xl lg:block dark:bg-[#070d1d]/85">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl dark:bg-[#070d1d]">
            <button className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close navigation" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-[272px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-sky-500/10 bg-slate-50/80 px-4 py-3 backdrop-blur-xl sm:px-6 dark:bg-[#04070f]/80">
          <div className="flex items-center gap-3">
            <button className="rounded-xl p-2 text-slate-600 hover:bg-sky-500/10 lg:hidden dark:text-slate-200" aria-label="Open navigation menu" aria-expanded={open} onClick={() => setOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center gap-2.5 lg:hidden">
              <ShieldLogo size={32} />
              <span className="font-extrabold text-slate-900 dark:text-white">ScamShield <span className="text-gradient">AI</span></span>
            </Link>
            <p className="hidden text-sm text-slate-500 lg:block dark:text-slate-400">
              Detect the Scam. <span className="font-semibold text-slate-700 dark:text-slate-200">Protect Your Money.</span> Stay Safe Online.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/scan" className="hidden rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110 sm:inline-flex">
              Scan a Message
            </Link>
            <button onClick={toggleTheme} className="rounded-xl border border-sky-500/20 p-2.5 text-slate-600 transition hover:bg-sky-500/10 dark:text-slate-200" aria-label={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} theme`}>
              {settings.theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-sky-500/10 px-4 py-8 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-6 text-sm text-slate-500 md:grid-cols-3 dark:text-slate-400">
            <div>
              <p className="mb-2 flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100"><ShieldLogo size={26} /> ScamShield AI</p>
              <p className="leading-relaxed">An explainable safety tool. The risk index is an experimental indicator — not a guarantee. Always verify through official channels.</p>
            </div>
            <nav aria-label="Footer">
              <p className="mb-2 font-bold text-slate-800 dark:text-slate-100">Product</p>
              <ul className="space-y-1.5">
                <li><Link className="hover:text-cyan-500" to="/scan">Scam Scanner</Link></li>
                <li><Link className="hover:text-cyan-500" to="/emergency">Emergency & Recovery</Link></li>
                <li><Link className="hover:text-cyan-500" to="/learn">Cyber-Safety Learning</Link></li>
                <li><Link className="hover:text-cyan-500" to="/settings">Privacy Settings</Link></li>
              </ul>
            </nav>
            <div>
              <p className="mb-2 font-bold text-slate-800 dark:text-slate-100">Official safety resources (India)</p>
              <ul className="space-y-1.5">
                <li><a className="inline-flex items-center gap-1 hover:text-cyan-500" href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer">National Cyber Crime Reporting Portal <ExternalLink className="h-3.5 w-3.5" /></a></li>
                <li>Cyber-fraud helpline: <a className="font-bold text-rose-500" href="tel:1930">1930</a></li>
                <li><a className="inline-flex items-center gap-1 hover:text-cyan-500" href="https://www.cert-in.org.in/" target="_blank" rel="noreferrer">CERT-In <ExternalLink className="h-3.5 w-3.5" /></a></li>
              </ul>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-6xl text-xs">© {new Date().getFullYear()} ScamShield AI — Hackathon/innovation project. Demo data is synthetic and labelled. ScamShield never asks for your OTP, PIN, or password.</p>
        </footer>
      </div>
    </div>
  )
}
