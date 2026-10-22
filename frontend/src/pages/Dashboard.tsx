import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts'
import { LayoutDashboard, ScanSearch, ShieldAlert, GraduationCap, Link2, TrendingUp, History as HistoryIcon, Info } from 'lucide-react'
import { loadHistory, loadProgress } from '../lib/store'
import { SYNTHETIC, QUIZ } from '../data/demo'
import { RISK_META } from '../components/Results'

const PIE_COLORS = ['#10b981', '#f59e0b', '#f43f5e']
const CAT_COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6', '#fb923c']

export default function Dashboard() {
  const history = useMemo(() => loadHistory(), [])
  const progress = useMemo(() => loadProgress(), [])
  const hasReal = history.length > 0

  const riskDist = useMemo(() => {
    if (!hasReal) return [{ name: 'Low', value: 46 }, { name: 'Medium', value: 31 }, { name: 'High', value: 23 }]
    const c = { low: 0, medium: 0, high: 0 }
    history.forEach((h) => { c[h.result.risk_level]++ })
    return [{ name: 'Low', value: c.low }, { name: 'Medium', value: c.medium }, { name: 'High', value: c.high }]
  }, [history, hasReal])

  const topSignals = useMemo(() => {
    if (!hasReal) return SYNTHETIC.signals
    const counts = new Map<string, number>()
    history.forEach((h) => h.result.signals.forEach((s) => counts.set(s.category, (counts.get(s.category) || 0) + 1)))
    const arr = [...counts.entries()].map(([signal, count]) => ({ signal, count })).sort((a, b) => b.count - a.count).slice(0, 6)
    return arr.length ? arr : [{ signal: 'No signals yet', count: 0 }]
  }, [history, hasReal])

  const total = hasReal ? history.length : 459
  const flagged = hasReal ? history.filter((h) => h.result.risk_level !== 'low').length : 142
  const safetyScore = Math.min(100, Math.round((progress.correct / Math.max(progress.answered, 1)) * 60 + (progress.completedIds.length / QUIZ.length) * 40))

  const stat = (label: string, value: string | number, sub: string, icon: React.ReactNode) => (
    <div className="glass rounded-3xl p-5">
      <p className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label} {icon}</p>
      <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white"><LayoutDashboard className="h-8 w-8 text-cyan-500" /> Security Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Your protection at a glance — scans, warning patterns and learning progress.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/scan" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110"><ScanSearch className="h-4 w-4" /> New scan</Link>
          <Link to="/scan" onClick={() => undefined} className="inline-flex items-center gap-2 rounded-xl border border-sky-500/25 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-sky-500/10 dark:text-slate-200"><Link2 className="h-4 w-4" /> Check a URL</Link>
        </div>
      </header>

      {!hasReal && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200" role="status">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>You haven&apos;t run any scans yet, so the numbers below are <strong>labelled synthetic demo data</strong>. Run your first scan and this dashboard switches to your real activity automatically.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat('Messages analyzed', total, hasReal ? 'From your scan history (this browser)' : 'Synthetic demo total', <ScanSearch className="h-4 w-4 text-cyan-500" />)}
        {stat('Flagged suspicious', flagged, 'Medium or high warning', <ShieldAlert className="h-4 w-4 text-rose-500" />)}
        {stat('Learning progress', `${safetyScore}%`, `${progress.correct}/${progress.answered || 0} quiz answers correct`, <GraduationCap className="h-4 w-4 text-violet-500" />)}
        {stat('Safety streak', progress.completedIds.length ? `${progress.completedIds.length}/${QUIZ.length} lessons` : 'Start learning', progress.completedIds.length ? 'Challenges completed' : 'Take the 2-minute quiz', <TrendingUp className="h-4 w-4 text-emerald-500" />)}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="glass rounded-3xl p-5 lg:col-span-2" aria-label="Risk distribution chart">
          <h2 className="mb-1 font-bold text-slate-900 dark:text-white">Risk-category distribution</h2>
          <p className="mb-2 text-xs text-slate-500">{hasReal ? 'Your scans' : 'Synthetic demo data'}</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDist} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3} strokeWidth={0}>
                  {riskDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v ?? ''}`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs font-semibold">
            {riskDist.map((d, i) => <span key={d.name} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />{d.name}: {d.value}</span>)}
          </div>
        </section>

        <section className="glass rounded-3xl p-5 lg:col-span-3" aria-label="Activity over time chart">
          <h2 className="mb-1 font-bold text-slate-900 dark:text-white">Analysis activity (7 days)</h2>
          <p className="mb-2 text-xs text-slate-500">Synthetic demo trend — not live national statistics</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SYNTHETIC.trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gScans" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} /><stop offset="100%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gFlag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} /> <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="scans" name="Scans" stroke="#22d3ee" strokeWidth={2.5} fill="url(#gScans)" />
                <Area type="monotone" dataKey="flagged" name="Flagged" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gFlag)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="glass rounded-3xl p-5 lg:col-span-3" aria-label="Common warning signals chart">
          <h2 className="mb-1 font-bold text-slate-900 dark:text-white">Most common warning signals</h2>
          <p className="mb-2 text-xs text-slate-500">{hasReal ? 'From your scan history' : 'Synthetic demo data'}</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSignals} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" />
                <XAxis type="number" tick={{ fontSize: 12 }} /> <YAxis type="category" dataKey="signal" tick={{ fontSize: 11.5 }} width={130} />
                <Tooltip />
                <Bar dataKey="count" name="Detections" radius={[0, 8, 8, 0]}>
                  {topSignals.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass rounded-3xl p-5 lg:col-span-2" aria-label="Recent scans">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><HistoryIcon className="h-5 w-5 text-cyan-500" /> Recent scans</h2>
          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sky-500/30 p-5 text-sm text-slate-500">
              No scans yet. <Link to="/scan?demo=banking" className="font-bold text-cyan-600 hover:underline dark:text-cyan-300">Try the fake-bank demo →</Link>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {history.slice(0, 5).map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900/[0.04] px-3.5 py-2.5 dark:bg-white/5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{h.input.slice(0, 64)}…</span>
                    <span className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString()} · {h.result.suspected_category}</span>
                  </span>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-extrabold ${RISK_META[h.result.risk_level].bg} ${RISK_META[h.result.risk_level].color}`}>{h.result.risk_index}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/history" className="mt-4 inline-block text-sm font-bold text-cyan-600 hover:underline dark:text-cyan-300">View full history →</Link>
        </section>
      </div>
    </div>
  )
}
