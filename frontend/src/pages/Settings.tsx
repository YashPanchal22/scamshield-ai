import { useState } from 'react'
import { Settings as SettingsIcon, Sun, Moon, ShieldCheck, Database, Trash2, Info } from 'lucide-react'
import { useSettings, clearHistory, loadSettings } from '../lib/store'
import { apiHealth } from '../services/api'
import { useEffect } from 'react'

export default function SettingsPage() {
  const { settings, update } = useSettings()
  const [saved, setSaved] = useState(false)
  const [health, setHealth] = useState<{ ok: boolean; ocr: boolean } | null>(null)

  useEffect(() => { apiHealth().then(setHealth) }, [])

  function patch(p: Partial<typeof settings>) {
    update({ ...settings, ...p })
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white"><SettingsIcon className="h-8 w-8 text-cyan-500" /> Settings &amp; Privacy</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Preferences are stored in this browser only. {saved && <span className="font-bold text-emerald-500" role="status">Saved ✓</span>}</p>
      </header>

      <section className="glass rounded-3xl p-5 sm:p-6" aria-labelledby="appearance">
        <h2 id="appearance" className="mb-4 font-bold text-slate-900 dark:text-white">Appearance</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">Theme</span>
          <div role="group" aria-label="Theme" className="flex gap-2">
            <button onClick={() => patch({ theme: 'dark' })} aria-pressed={settings.theme === 'dark'} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${settings.theme === 'dark' ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white' : 'border border-sky-500/25 text-slate-600 dark:text-slate-300'}`}><Moon className="h-4 w-4" /> Dark</button>
            <button onClick={() => patch({ theme: 'light' })} aria-pressed={settings.theme === 'light'} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${settings.theme === 'light' ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white' : 'border border-sky-500/25 text-slate-600 dark:text-slate-300'}`}><Sun className="h-4 w-4" /> Light</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor="deflang" className="text-sm font-medium">Default scan language</label>
          <select id="deflang" value={settings.language} onChange={(e) => patch({ language: e.target.value })} className="rounded-xl border border-sky-500/20 bg-white px-3 py-2.5 text-sm dark:bg-[#0b1428]">
            <option value="auto">Auto-detect</option><option value="en">English</option><option value="hi">Hindi</option><option value="hinglish">Hinglish</option><option value="gu">Gujarati</option>
          </select>
        </div>
      </section>

      <section className="glass rounded-3xl p-5 sm:p-6" aria-labelledby="privacy-opts">
        <h2 id="privacy-opts" className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><ShieldCheck className="h-5 w-5 text-cyan-500" /> Privacy &amp; data retention</h2>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={settings.saveHistory} onChange={(e) => patch({ saveHistory: e.target.checked })} className="mt-0.5 h-5 w-5 accent-cyan-500" />
          <span><strong>Save scan history in this browser.</strong> When off, scans are analyzed and forgotten immediately. History is never uploaded to a server in guest mode.</span>
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor="retention" className="text-sm font-medium">Auto-delete history older than</label>
          <select id="retention" value={settings.retentionDays} onChange={(e) => patch({ retentionDays: Number(e.target.value) })} disabled={!settings.saveHistory} className="rounded-xl border border-sky-500/20 bg-white px-3 py-2.5 text-sm disabled:opacity-50 dark:bg-[#0b1428]">
            <option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={365}>1 year</option>
          </select>
        </div>
        <button onClick={() => { if (window.confirm('Delete all locally stored scan history now?')) { clearHistory(); setSaved(true); setTimeout(() => setSaved(false), 1600) } }}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300">
          <Trash2 className="h-4 w-4" /> Delete all my scan history
        </button>
        <ul className="mt-5 space-y-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          <li>• ScamShield never requests real OTPs, PINs, passwords or full card numbers.</li>
          <li>• Backend analysis runs in memory; screenshots are not stored server-side by default.</li>
          <li>• No external AI service receives your content unless an operator configures one server-side — none is configured in this build.</li>
          <li>• Account mode (Supabase Auth) is optional and off by default; guest mode needs no sign-up.</li>
        </ul>
      </section>

      <section className="glass rounded-3xl p-5 sm:p-6" aria-labelledby="system">
        <h2 id="system" className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Database className="h-5 w-5 text-cyan-500" /> System status</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-900/[0.04] px-4 py-3 dark:bg-white/[0.05]"><dt className="text-xs uppercase tracking-wide text-slate-500">Backend API</dt><dd className="mt-0.5 font-bold">{health === null ? 'Checking…' : health.ok ? 'Connected (FastAPI)' : 'Unreachable — on-device fallback active'}</dd></div>
          <div className="rounded-2xl bg-slate-900/[0.04] px-4 py-3 dark:bg-white/[0.05]"><dt className="text-xs uppercase tracking-wide text-slate-500">Server OCR</dt><dd className="mt-0.5 font-bold">{health === null ? 'Checking…' : health.ocr ? 'Available (tesseract)' : 'Not installed — browser OCR used'}</dd></div>
          <div className="rounded-2xl bg-slate-900/[0.04] px-4 py-3 dark:bg-white/[0.05]"><dt className="text-xs uppercase tracking-wide text-slate-500">Detection engine</dt><dd className="mt-0.5 font-bold">Rule-based v1.0 (explainable)</dd></div>
        </dl>
        <p className="mt-4 flex items-start gap-2 text-[13px] text-slate-500 dark:text-slate-400"><Info className="mt-0.5 h-4 w-4 shrink-0" /> Current saved settings snapshot: theme={loadSettings().theme}, language={loadSettings().language}, history={loadSettings().saveHistory ? 'on' : 'off'} ({loadSettings().retentionDays} days).</p>
      </section>
    </div>
  )
}
