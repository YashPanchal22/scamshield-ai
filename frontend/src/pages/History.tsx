import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { History as HistoryIcon, Search, Trash2, Download, X, Eraser } from 'lucide-react'
import { loadHistory, deleteHistory, clearHistory, buildShareReport, downloadText } from '../lib/store'
import { ResultsView, RISK_META } from '../components/Results'
import type { ScanRecord } from '../types'

export default function HistoryPage() {
  const [items, setItems] = useState<ScanRecord[]>(() => loadHistory())
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [openId, setOpenId] = useState<string>('')

  const visible = useMemo(
    () =>
      items.filter(
        (h) =>
          (filter === 'all' || h.result.risk_level === filter) &&
          (h.input.toLowerCase().includes(query.toLowerCase()) || h.result.suspected_category.toLowerCase().includes(query.toLowerCase())),
      ),
    [items, query, filter],
  )

  const opened = items.find((h) => h.id === openId)

  function remove(id: string) { setItems(deleteHistory(id)); if (openId === id) setOpenId('') }
  function clearAll() { if (window.confirm('Delete ALL scan history from this browser? This cannot be undone.')) { clearHistory(); setItems([]); setOpenId('') } }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white"><HistoryIcon className="h-8 w-8 text-cyan-500" /> Scan History</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Guest-mode history is stored <strong>only in this browser</strong> (local storage) — it never syncs to a server, and clearing browser data erases it. You can disable saving or change retention in Settings.
        </p>
      </header>

      <div className="glass flex flex-wrap items-center gap-3 rounded-3xl p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label htmlFor="hq" className="sr-only">Search history</label>
          <input id="hq" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages or categories…"
            className="w-full rounded-xl border border-sky-500/20 bg-white/80 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-cyan-400 dark:bg-[#0b1428]/80" />
        </div>
        <div role="group" aria-label="Filter by risk" className="flex gap-1.5">
          {(['all', 'low', 'medium', 'high'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={`rounded-full px-3.5 py-2 text-xs font-extrabold uppercase transition ${filter === f ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white' : 'border border-sky-500/25 text-slate-600 hover:bg-sky-500/10 dark:text-slate-300'}`}>
              {f}
            </button>
          ))}
        </div>
        {items.length > 0 && (
          <button onClick={clearAll} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-500 transition hover:bg-rose-500/10"><Eraser className="h-4 w-4" /> Delete all</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-sky-500/30 p-10 text-center text-sm text-slate-500">
          No scans saved yet. <Link to="/scan" className="font-bold text-cyan-600 hover:underline dark:text-cyan-300">Run your first scan →</Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-sky-500/30 p-10 text-center text-sm text-slate-500">No reports match your search/filter.</div>
      ) : (
        <ul className="space-y-3">
          {visible.map((h) => (
            <li key={h.id} className="glass rounded-3xl p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${RISK_META[h.result.risk_level].bg} ${RISK_META[h.result.risk_level].color}`}>
                  {h.result.risk_index}/100 · {h.result.risk_level.toUpperCase()}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{h.result.suspected_category}</span>
                <span className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString()} · {h.input_type}</span>
                <span className="ml-auto flex gap-1.5">
                  <button onClick={() => setOpenId(openId === h.id ? '' : h.id)} className="rounded-lg border border-sky-500/25 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-sky-500/10 dark:text-slate-200" aria-expanded={openId === h.id}>
                    {openId === h.id ? 'Hide report' : 'View report'}
                  </button>
                  <button onClick={() => downloadText(`scamshield-report-${h.id.slice(0, 8)}.txt`, buildShareReport(h))} className="inline-flex items-center gap-1 rounded-lg border border-sky-500/25 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-sky-500/10 dark:text-slate-200"><Download className="h-3.5 w-3.5" /> Export</button>
                  <button onClick={() => remove(h.id)} aria-label="Delete report" className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </span>
              </div>
              <p className="mt-2 line-clamp-2 break-words text-sm text-slate-600 dark:text-slate-300">{h.input}</p>
              {openId === h.id && opened && (
                <div className="mt-4 border-t border-sky-500/10 pt-4">
                  <button onClick={() => setOpenId('')} className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-500"><X className="h-4 w-4" /> Close</button>
                  <ResultsView result={opened.result} input={opened.input} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
