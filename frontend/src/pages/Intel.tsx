import { useMemo, useState } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts'
import { BarChart3, Info, Lightbulb } from 'lucide-react'
import { SYNTHETIC } from '../data/demo'
import { loadHistory } from '../lib/store'

const COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6', '#fb923c', '#34d399']

const INSIGHTS = [
  'Urgency language appears in the majority of flagged demo messages — scammers fear the pause you take to verify.',
  'Fake-KYC + account-block combinations are the most reliable bank-phishing fingerprint in our demo set.',
  'Weekend evenings show the highest synthetic scan volume — exactly when bank branches are closed and verification feels harder.',
  'Hinglish scams are rising in the demo data: fraud follows the language of trust. Safety education must be multilingual.',
]

export default function Intel() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const history = useMemo(() => loadHistory(), [])
  const hasReal = history.length >= 3

  const categories = useMemo(() => {
    if (!hasReal) return SYNTHETIC.categories
    const counts = new Map<string, number>()
    history.forEach((h) => counts.set(h.result.suspected_category, (counts.get(h.result.suspected_category) || 0) + 1))
    return [...counts.entries()].map(([name, value]) => ({ name, value }))
  }, [history, hasReal])

  const filteredSignals = categoryFilter === 'all' ? SYNTHETIC.signals : SYNTHETIC.signals.filter((s) => s.signal.toLowerCase().includes(categoryFilter))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white"><BarChart3 className="h-8 w-8 text-cyan-500" /> Scam Intelligence Dashboard</h1>
        <p className="mt-1.5 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200" role="status">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span><strong>Synthetic demonstration data.</strong> These charts illustrate the product experience with fictional numbers. They are <strong>not</strong> live or national cybercrime statistics. {hasReal ? 'The category chart below already reflects your own scans.' : 'Run a few scans and the category chart will switch to your real data.'}</span>
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="glass rounded-3xl p-5" aria-label="Scam category distribution">
          <h2 className="font-bold text-slate-900 dark:text-white">Scam-category distribution {hasReal ? '(your scans)' : '(synthetic)'}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} strokeWidth={0}>
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs font-semibold">
            {categories.map((c, i) => <span key={c.name} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{c.name}: {c.value}{hasReal ? '' : '%'}</span>)}
          </div>
        </section>

        <section className="glass rounded-3xl p-5" aria-label="Language distribution">
          <h2 className="font-bold text-slate-900 dark:text-white">Message language (synthetic)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SYNTHETIC.languages} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} /> <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v ?? 0}%`, 'Share']} />
                <Bar dataKey="value" name="Share %" radius={[8, 8, 0, 0]}>
                  {SYNTHETIC.languages.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-slate-500">Why ScamShield detects Hinglish, Hindi &amp; Gujarati patterns — fraud speaks your language.</p>
        </section>
      </div>

      <section className="glass rounded-3xl p-5" aria-label="Trend over time">
        <h2 className="font-bold text-slate-900 dark:text-white">Sample trend — scans vs. flagged (synthetic, 7 days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SYNTHETIC.trend} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gi1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                <linearGradient id="gi2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} /> <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="scans" name="Scans" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gi1)" />
              <Area type="monotone" dataKey="flagged" name="Flagged" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gi2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="glass rounded-3xl p-5" aria-label="Frequent warning indicators">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900 dark:text-white">Frequently encountered warning indicators</h2>
          <div>
            <label htmlFor="sigfilter" className="sr-only">Filter indicators</label>
            <select id="sigfilter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-sky-500/20 bg-white px-3 py-2 text-sm dark:bg-[#0b1428]">
              <option value="all">All indicators</option><option value="otp">OTP-related</option><option value="link">Link-related</option><option value="urgency">Urgency</option><option value="kyc">KYC</option><option value="fee">Fees</option>
            </select>
          </div>
        </div>
        {filteredSignals.length ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredSignals} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" />
                <XAxis type="number" tick={{ fontSize: 12 }} /> <YAxis type="category" dataKey="signal" width={140} tick={{ fontSize: 11.5 }} />
                <Tooltip />
                <Bar dataKey="count" name="Synthetic detections" fill="#22d3ee" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="py-8 text-center text-sm text-slate-500">No indicators match this filter in the synthetic set.</p>}
      </section>

      <section className="glass rounded-3xl p-5 sm:p-6" aria-label="Educational insights">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Lightbulb className="h-5 w-5 text-amber-400" /> Educational insights (from the demo dataset)</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {INSIGHTS.map((t, i) => <li key={i} className="rounded-2xl bg-slate-900/[0.04] px-4 py-3 text-sm leading-relaxed text-slate-700 dark:bg-white/[0.05] dark:text-slate-200">{t}</li>)}
        </ul>
      </section>
    </div>
  )
}
