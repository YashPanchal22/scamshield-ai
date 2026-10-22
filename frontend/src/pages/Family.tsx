import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Copy, Download, Eye, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react'
import { loadHistory, buildShareReport, downloadText, deleteHistory } from '../lib/store'
import { RISK_META } from '../components/Results'

export default function Family() {
  const [history, setHistory] = useState(() => loadHistory())
  const [selectedId, setSelectedId] = useState<string>('')
  const [confirmed, setConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)

  const record = useMemo(() => history.find((h) => h.id === selectedId) || history[0], [history, selectedId])
  const report = useMemo(() => (record ? buildShareReport(record) : ''), [record])

  function copy() {
    if (!confirmed) return
    navigator.clipboard.writeText(report).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
  }
  function download() {
    if (!confirmed || !record) return
    downloadText(`scamshield-family-report-${new Date(record.created_at).toISOString().slice(0, 10)}.txt`, report)
  }
  function remove(id: string) { setHistory(deleteHistory(id)) }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white"><Users className="h-8 w-8 text-cyan-500" /> Family Protection Mode</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Prepare a <strong>privacy-filtered</strong> summary to share with a trusted family member. Phone numbers, emails, UPI IDs and codes are redacted. ScamShield never sends anything itself — you review, confirm, then copy or download and share it your way.
        </p>
      </header>

      {history.length === 0 ? (
        <div className="glass rounded-[1.75rem] p-8 text-center">
          <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-cyan-500" />
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">No scan reports yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">Run a scan first (or try a fictional demo), then come back here to prepare a safe, redacted summary for your family.</p>
          <Link to="/scan?demo=banking" className="mt-5 inline-block rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 px-6 py-3 font-bold text-white shadow-xl shadow-cyan-500/25 transition hover:brightness-110">Run the demo scan</Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <section className="space-y-2.5" aria-label="Choose a report">
            {history.map((h) => (
              <div key={h.id} className={`flex items-center gap-2 rounded-2xl border px-4 py-3 transition ${record?.id === h.id ? 'border-cyan-500/50 bg-cyan-500/10' : 'glass'}`}>
                <button onClick={() => { setSelectedId(h.id); setConfirmed(false) }} className="min-w-0 flex-1 text-left" aria-pressed={record?.id === h.id}>
                  <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{h.input.slice(0, 52)}…</span>
                  <span className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString()}</span>
                </button>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-extrabold ${RISK_META[h.result.risk_level].bg} ${RISK_META[h.result.risk_level].color}`}>{h.result.risk_index}</span>
                <button onClick={() => remove(h.id)} aria-label="Delete this report" className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </section>

          <section className="glass glow-ring rounded-[1.75rem] p-5 sm:p-6">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Eye className="h-5 w-5 text-cyan-500" /> Report preview (exactly what will be shared)</h2>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950/[0.04] p-4 font-mono text-[12.5px] leading-relaxed text-slate-700 dark:bg-black/30 dark:text-slate-200">{report}</pre>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-cyan-500" />
              <span><AlertTriangle className="mr-1 inline h-4 w-4 text-amber-500" />I have reviewed this preview. I understand it will be <strong>copied/downloaded to my device</strong> and that I choose how to share it. ScamShield does not send it to anyone.</span>
            </label>

            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={copy} disabled={!confirmed} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"><Copy className="h-4 w-4" /> {copied ? 'Copied ✓' : 'Copy report'}</button>
              <button onClick={download} disabled={!confirmed} className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-700 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-cyan-300"><Download className="h-4 w-4" /> Download report</button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Privacy controls: sensitive identifiers are auto-redacted; delete any report with the trash icon; disable history entirely in Settings. We do not pretend to send email/WhatsApp messages — no such service is configured.
            </p>
          </section>
        </div>
      )}
    </div>
  )
}
