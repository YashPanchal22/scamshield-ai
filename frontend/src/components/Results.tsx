import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ShieldAlert, Info, Link2, ListChecks, FileText, Cpu } from 'lucide-react'
import type { AnalyzeResponse } from '../types'

export const RISK_META: Record<string, { label: string; color: string; hex: string; bg: string; advice: string }> = {
  low: { label: 'LOW WARNING', color: 'text-emerald-600 dark:text-emerald-400', hex: '#10b981', bg: 'bg-emerald-500/10 border-emerald-500/30', advice: 'Fewer red flags found — still not a guarantee of legitimacy.' },
  medium: { label: 'MEDIUM WARNING', color: 'text-amber-600 dark:text-amber-400', hex: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/30', advice: 'Proceed with caution. Verify the sender independently before acting.' },
  high: { label: 'HIGH WARNING', color: 'text-rose-600 dark:text-rose-400', hex: '#f43f5e', bg: 'bg-rose-500/10 border-rose-500/30', advice: 'Strong scam indicators. Do not pay, share codes, or tap links.' },
}

export function RiskGauge({ value, level }: { value: number; level: string }) {
  const r = 74
  const circ = 2 * Math.PI * r
  const filled = (value / 100) * circ * 0.75
  const meta = RISK_META[level] ?? RISK_META.low
  return (
    <div className="relative mx-auto h-[190px] w-[190px]" role="img" aria-label={`Risk index ${value} out of 100, ${meta.label}`}>
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-[225deg]">
        <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(100,116,139,0.25)" strokeWidth="13" strokeDasharray={`${circ * 0.75} ${circ}`} strokeLinecap="round" />
        <motion.circle
          cx="90" cy="90" r={r} fill="none" stroke={meta.hex} strokeWidth="13" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`} initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${filled} ${circ}` }} transition={{ duration: 1.1, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${meta.hex}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">{value}</span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Risk Index / 100</span>
        <span className={`mt-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${meta.bg} ${meta.color}`}>{meta.label}</span>
      </div>
    </div>
  )
}

/** Highlights evidence excerpts inside the original text (XSS-safe: React text nodes only). */
export function HighlightedText({ text, phrases }: { text: string; phrases: string[] }) {
  const parts = useMemo(() => {
    const needles = phrases
      .map((p) => p.replace(/…/g, '').trim())
      .filter((p) => p.length >= 4)
      .sort((a, b) => b.length - a.length)
    if (!needles.length) return [{ t: text, hot: false }]
    const out: { t: string; hot: boolean }[] = []
    let rest = text
    let guard = 0
    while (rest && guard++ < 200) {
      let bestIdx = -1
      let bestNeedle = ''
      for (const n of needles) {
        const idx = rest.toLowerCase().indexOf(n.slice(0, 40).toLowerCase())
        if (idx >= 0 && (bestIdx === -1 || idx < bestIdx)) { bestIdx = idx; bestNeedle = n }
      }
      if (bestIdx === -1) { out.push({ t: rest, hot: false }); break }
      if (bestIdx > 0) out.push({ t: rest.slice(0, bestIdx), hot: false })
      const len = Math.min(bestNeedle.length, 90)
      out.push({ t: rest.slice(bestIdx, bestIdx + len), hot: true })
      rest = rest.slice(bestIdx + len)
    }
    return out
  }, [text, phrases])

  return (
    <p className="whitespace-pre-wrap break-words leading-relaxed">
      {parts.map((p, i) =>
        p.hot ? (
          <mark key={i} className="rounded bg-rose-500/25 px-0.5 font-semibold text-rose-700 underline decoration-rose-400 decoration-2 underline-offset-2 dark:text-rose-200">{p.t}</mark>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </p>
  )
}

const SEV_STYLE: Record<string, string> = {
  critical: 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300',
  high: 'border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-300',
  medium: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300',
  low: 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300',
}

export function ResultsView({ result, input, onReset }: { result: AnalyzeResponse; input: string; onReset?: () => void }) {
  const meta = RISK_META[result.risk_level]
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} aria-live="polite" className="space-y-5">
      <div className="glass glow-ring rounded-3xl p-5 sm:p-7">
        <div className="grid items-center gap-6 md:grid-cols-[210px_1fr]">
          <RiskGauge value={result.risk_index} level={result.risk_level} />
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {result.risk_level === 'low' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <ShieldAlert className="h-4 w-4 text-rose-500" />}
              Analysis complete · {result.processing_ms} ms · {result.word_count} words
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Suspected category: <span className={meta.color}>{result.suspected_category}</span>
            </h2>
            <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">{result.summary}</p>
            <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${meta.bg} ${meta.color}`}>{meta.advice}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Cpu className="h-3.5 w-3.5" /> Engine: {result.engine_source || 'FastAPI backend'} · v{result.engine_version} · Language: {result.language_detected}
              {result.ocr_engine ? ` · OCR: ${result.ocr_engine}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-5 sm:p-6">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><FileText className="h-5 w-5 text-cyan-500" /> Evidence in your message</h3>
        <HighlightedText text={input} phrases={result.highlighted_phrases} />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Highlighted phrases triggered the detection rules below. Links are shown as plain text and are <strong>never opened automatically</strong>.</p>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><AlertTriangle className="h-5 w-5 text-amber-500" /> Warning signals ({result.signals.length})</h3>
        {result.signals.length === 0 ? (
          <div className="glass rounded-3xl p-5 text-sm text-slate-600 dark:text-slate-300">
            No detection rules fired on this content. That means fewer known red flags — it does <strong>not</strong> prove the message is genuine. Sender identity and link destinations were not verified.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {result.signals.map((s, i) => (
              <motion.article key={s.rule_id + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">{s.category}</h4>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-extrabold uppercase ${SEV_STYLE[s.severity_label]}`}>{s.severity_label} · +{s.severity}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s.explanation}</p>
                <blockquote className="mt-2 break-words rounded-lg bg-slate-900/5 px-3 py-2 text-xs italic text-slate-600 dark:bg-white/5 dark:text-slate-300">“{s.excerpt}”</blockquote>
                <p className="mt-2 text-xs font-medium text-cyan-700 dark:text-cyan-300">→ {s.recommended_action}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">Rule: {s.rule_id}</p>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {result.url_findings.length > 0 && (
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Link2 className="h-5 w-5 text-violet-500" /> URL inspection (pattern-based — link never visited)</h3>
          <ul className="space-y-2.5">
            {result.url_findings.map((f, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span><strong className="text-slate-900 dark:text-white">{f.title}.</strong> <span className="text-slate-600 dark:text-slate-300">{f.detail}</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-cyan-500/25 bg-cyan-500/5 p-5 sm:p-6">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><ListChecks className="h-5 w-5 text-cyan-500" /> What to do now</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {result.recommended_actions.map((a, i) => <li key={i}>{a}</li>)}
          </ol>
          {onReset && (
            <button onClick={onReset} className="mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110">
              Analyze another message
            </button>
          )}
        </div>
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Info className="h-5 w-5 text-sky-500" /> Confidence &amp; limitations</h3>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{result.uncertainty_statement}</p>
        </div>
      </div>
    </motion.section>
  )
}
