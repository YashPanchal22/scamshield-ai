import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ScanSearch, Link2, ImageUp, Type, Loader2, RotateCcw, Trash2,
  AlertTriangle, ShieldAlert, Sparkles, X, Share2, Download, Users,
} from 'lucide-react'
import { analyzeText, analyzeUrl, analyzeImage, ocrOnDevice, apiHealth } from '../services/api'
import type { AnalyzeResponse, UrlCheckResponse } from '../types'
import { ResultsView, RISK_META, RiskGauge } from '../components/Results'
import { DEMO_SCENARIOS } from '../data/demo'
import { addHistory, buildShareReport, downloadText } from '../lib/store'

type Tab = 'text' | 'url' | 'image'

const langOptions = [
  { value: 'auto', label: 'Auto-detect language' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi (हिंदी)' },
  { value: 'hinglish', label: 'Hinglish' },
  { value: 'gu', label: 'Gujarati (ગુજરાતી)' },
]

export default function Scanner() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>('text')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [language, setLanguage] = useState('auto')
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [extractedText, setExtractedText] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [resultInput, setResultInput] = useState('')
  const [urlResult, setUrlResult] = useState<UrlCheckResponse | null>(null)
  const [activeDemo, setActiveDemo] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const demo = params.get('demo')
    if (demo) loadDemo(demo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadDemo(id: string) {
    const d = DEMO_SCENARIOS.find((s) => s.id === id)
    if (!d) return
    setActiveDemo(id)
    setTab('text')
    setText(d.text)
    setResult(null)
    setUrlResult(null)
    setError('')
    setNotice(`${d.title} loaded (fictional). ${d.expected}`)
  }

  function reset() {
    setResult(null); setUrlResult(null); setError(''); setNotice(''); setExtractedText(''); setOcrProgress(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearAll() {
    setText(''); setUrl(''); setFile(null); setFilePreview(''); setActiveDemo(''); reset()
  }

  function saveRecord(input: string, type: 'text' | 'url' | 'screenshot', res: AnalyzeResponse) {
    addHistory({ id: crypto.randomUUID(), created_at: new Date().toISOString(), input, input_type: type, language, result: res })
  }

  async function runText() {
    if (text.trim().length < 3) { setError('Please paste at least a few words of the suspicious message.'); return }
    setLoading(true); setError(''); setResult(null); setUrlResult(null)
    try {
      const res = await analyzeText(text.trim(), language)
      setResult(res); setResultInput(text.trim()); saveRecord(text.trim(), 'text', res)
      if (res.engine_source?.includes('fallback')) setNotice('Backend was unreachable, so this analysis ran with the on-device fallback engine (clearly labelled in the report).')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Please retry.')
    } finally { setLoading(false) }
  }

  async function runUrl() {
    if (url.trim().length < 4) { setError('Please enter a URL to inspect.'); return }
    setLoading(true); setError(''); setUrlResult(null); setResult(null)
    try { setUrlResult(await analyzeUrl(url.trim())) }
    catch (e) { setError(e instanceof Error ? e.message : 'URL check failed. Please retry.') }
    finally { setLoading(false) }
  }

  function pickFile(f: File | undefined) {
    setError(''); setExtractedText(''); setResult(null)
    if (!f) return
    const okTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp']
    if (!okTypes.includes(f.type)) { setError(`Unsupported file type "${f.type || 'unknown'}". Please upload a PNG, JPEG, WEBP or BMP screenshot.`); return }
    if (f.size > 5 * 1024 * 1024) { setError('Image is larger than 5 MB. Please upload a smaller screenshot.'); return }
    setFile(f)
    setFilePreview(URL.createObjectURL(f))
  }

  async function runImage() {
    if (!file) { setError('Please choose a screenshot first.'); return }
    setLoading(true); setError(''); setResult(null); setOcrProgress(0); setExtractedText('')
    try {
      const health = await apiHealth()
      if (health.ok && health.ocr) {
        const res = await analyzeImage(file, language)
        const extracted = res.extracted_text || ''
        setExtractedText(extracted); setResult(res); setResultInput(extracted); saveRecord(extracted, 'screenshot', res)
        setNotice('Text extracted with server-side OCR, then analyzed. Your screenshot was processed in memory and not stored.')
        return
      }
      if (health.ok && !health.ocr) {
        setNotice('Server-side OCR is not installed on this host, so we switched to on-device OCR (Tesseract.js). Your screenshot never leaves this browser.')
      }
      const ocrText = await ocrOnDevice(file, language, setOcrProgress)
      if (!ocrText || ocrText.length < 3) {
        setError('OCR could not extract readable text from this screenshot. Try a clearer, straight-on image — or paste the message text in the Text tab. We will not pretend the image was analyzed.')
        return
      }
      setExtractedText(ocrText)
      const res = await analyzeText(ocrText, language)
      const finalRes = { ...res, extracted_text: ocrText, ocr_engine: 'Tesseract.js (on-device)' }
      setResult(finalRes); setResultInput(ocrText); saveRecord(ocrText, 'screenshot', finalRes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Screenshot analysis failed. Please retry or paste the text instead.')
    } finally { setLoading(false); setOcrProgress(0) }
  }

  function share() {
    if (!result) return
    const report = buildShareReport({ id: 'current', created_at: new Date().toISOString(), input: resultInput, input_type: 'text', language, result })
    navigator.clipboard.writeText(report).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
  }

  function exportReport() {
    if (!result) return
    const report = buildShareReport({ id: 'current', created_at: new Date().toISOString(), input: resultInput, input_type: 'text', language, result })
    downloadText(`scamshield-report-${new Date().toISOString().slice(0, 10)}.txt`, report)
  }

  const tabBtn = (id: Tab, icon: React.ReactNode, label: string) => (
    <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setError('') }}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${tab === id ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/25' : 'text-slate-600 hover:bg-sky-500/10 dark:text-slate-300'}`}>
      {icon} <span className="hidden sm:inline">{label}</span><span className="sm:hidden">{label.split(' ')[0]}</span>
    </button>
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white"><ScanSearch className="h-8 w-8 text-cyan-500" /> Scam Scanner</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Paste a suspicious message, inspect a link, or upload a screenshot. <strong>Remove personal details first</strong> — and never type a real OTP, PIN or password here. ScamShield will never ask for them.
        </p>
      </header>

      {/* Demo scenarios */}
      <section aria-labelledby="demo" className="glass rounded-3xl p-5">
        <h2 id="demo" className="mb-1 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Sparkles className="h-5 w-5 text-violet-500" /> Try a live demo <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-extrabold uppercase text-violet-600 dark:text-violet-300">Fictional examples</span></h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">All scenarios are synthetic, created for education. They run through the real detection engine — results are never hard-coded.</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_SCENARIOS.map((d) => (
            <button key={d.id} onClick={() => loadDemo(d.id)} aria-pressed={activeDemo === d.id}
              className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${activeDemo === d.id ? 'border-violet-500/60 bg-violet-500/20 text-violet-700 dark:text-violet-200' : 'border-sky-500/20 text-slate-600 hover:bg-sky-500/10 dark:text-slate-300'}`}>
              {d.title}
            </button>
          ))}
        </div>
      </section>

      {/* Input card */}
      <section className="glass glow-ring relative overflow-hidden rounded-[1.75rem] p-5 sm:p-6" aria-label="Scanner input">
        {loading && <div className="scan-beam pointer-events-none absolute left-0 right-0 z-10 h-14 bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent" aria-hidden="true" />}
        <div role="tablist" aria-label="Input type" className="mb-5 flex gap-2 rounded-2xl bg-slate-900/[0.04] p-1.5 dark:bg-white/5">
          {tabBtn('text', <Type className="h-4 w-4" />, 'Message Text')}
          {tabBtn('url', <Link2 className="h-4 w-4" />, 'Suspicious URL')}
          {tabBtn('image', <ImageUp className="h-4 w-4" />, 'Screenshot')}
        </div>

        {tab === 'text' && (
          <div>
            <label htmlFor="msg" className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-100">Paste the suspicious SMS / WhatsApp / email text</label>
            <textarea id="msg" value={text} onChange={(e) => setText(e.target.value)} rows={7} maxLength={8000}
              placeholder="e.g. Dear customer, your account will be blocked… share the OTP to verify…"
              className="w-full rounded-2xl border border-sky-500/20 bg-white/80 p-4 text-[15px] leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:bg-[#0b1428]/80 dark:text-slate-100" />
            <p className="mt-1 text-right text-xs text-slate-400">{text.length}/8000 · {text.trim() ? text.trim().split(/\s+/).length : 0} words</p>
          </div>
        )}

        {tab === 'url' && (
          <div>
            <label htmlFor="url" className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-100">Enter the suspicious link (we never open it)</label>
            <input id="url" type="text" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={2048}
              placeholder="e.g. http://sbi-kyc-verify.xyz/login or bit.ly/claim-prize"
              className="w-full rounded-2xl border border-sky-500/20 bg-white/80 p-4 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:bg-[#0b1428]/80 dark:text-slate-100" />
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {['http://192.168.10.5/sbi-login', 'https://hdfc.secure-verify.xyz/login', 'https://bit.ly/free-prize-2026', 'https://www.onlinesbi.sbi/'].map((u) => (
                <button key={u} onClick={() => setUrl(u)} className="rounded-full border border-sky-500/25 px-2.5 py-1 font-medium text-slate-600 transition hover:bg-sky-500/10 dark:text-slate-300">{u}</button>
              ))}
            </div>
          </div>
        )}

        {tab === 'image' && (
          <div>
            <label htmlFor="img" className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-100">Upload a screenshot of the suspicious message (PNG/JPEG/WEBP/BMP, max 5 MB)</label>
            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]) }}
              className="rounded-2xl border-2 border-dashed border-sky-500/30 bg-sky-500/[0.04] p-5 text-center">
              <input id="img" ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/bmp" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
              {!file ? (
                <>
                  <ImageUp className="mx-auto mb-2 h-9 w-9 text-cyan-500" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">Drag &amp; drop a screenshot here, or</p>
                  <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-700 transition hover:bg-cyan-500/20 dark:text-cyan-300">Choose image</button>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Tip: crop out names, numbers and balances first. OCR runs on-device when the server has no OCR engine.</p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <img src={filePreview} alt="Uploaded screenshot preview" className="max-h-56 rounded-xl border border-sky-500/20 object-contain" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>
                  <button type="button" onClick={() => { setFile(null); setFilePreview('') }} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-rose-500 hover:bg-rose-500/10"><X className="h-4 w-4" /> Remove</button>
                </div>
              )}
            </div>
            {loading && ocrProgress > 0 && (
              <div className="mt-3" role="progressbar" aria-valuenow={ocrProgress} aria-valuemin={0} aria-valuemax={100} aria-label="OCR progress">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all" style={{ width: `${ocrProgress}%` }} /></div>
                <p className="mt-1 text-xs text-slate-500">Extracting text on your device… {ocrProgress}%</p>
              </div>
            )}
            {extractedText && (
              <div className="mt-3 rounded-2xl bg-slate-900/[0.04] p-4 dark:bg-white/5">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Text extracted by OCR (verify before trusting the result)</p>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{extractedText}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="lang" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Message language</label>
            <select id="lang" value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-xl border border-sky-500/20 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none dark:bg-[#0b1428] dark:text-slate-100">
              {langOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button onClick={tab === 'text' ? runText : tab === 'url' ? runUrl : runImage} disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-600 to-violet-500 px-6 py-3 font-extrabold text-white shadow-xl shadow-cyan-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanSearch className="h-5 w-5" />}
            {loading ? 'Analyzing…' : tab === 'url' ? 'Inspect URL' : 'Analyze Now'}
          </button>
          <button onClick={clearAll} className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/25 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-sky-500/10 dark:text-slate-300"><Trash2 className="h-4 w-4" /> Clear</button>
          {(result || urlResult) && <button onClick={reset} className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/25 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-sky-500/10 dark:text-slate-300"><RotateCcw className="h-4 w-4" /> Reset results</button>}
        </div>

        {notice && <p role="status" className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-800 dark:text-violet-200">{notice}</p>}
        {error && (
          <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error} <button className="font-bold underline" onClick={tab === 'text' ? runText : tab === 'url' ? runUrl : runImage}>Retry</button></span>
          </div>
        )}
      </section>

      {loading && !result && !urlResult && (
        <div className="glass flex items-center justify-center gap-3 rounded-3xl py-10 text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-500" /> Running contextual detection rules &amp; building your evidence report…
        </div>
      )}

      {urlResult && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} aria-live="polite" className="glass glow-ring rounded-[1.75rem] p-5 sm:p-7">
          <div className="grid items-center gap-6 md:grid-cols-[210px_1fr]">
            <RiskGauge value={urlResult.risk_index} level={urlResult.risk_level} />
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">URL Inspection Result</h2>
              <p className="mt-1 break-all rounded-lg bg-slate-900/5 px-3 py-2 font-mono text-[13px] dark:bg-white/5">{urlResult.normalized_url}</p>
              <p className={`mt-2 text-sm font-bold ${RISK_META[urlResult.risk_level].color}`}>{RISK_META[urlResult.risk_level].advice}</p>
              <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">{urlResult.summary}</p>
              <p className="mt-2 text-xs text-slate-500">{urlResult.disclaimer} · Engine: {urlResult.engine_source || 'FastAPI backend'}</p>
            </div>
          </div>
          {urlResult.findings.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {urlResult.findings.map((f, i) => (
                <li key={i} className="flex gap-3 rounded-2xl bg-slate-900/[0.04] px-4 py-3 text-sm dark:bg-white/5">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <span><strong className="text-slate-900 dark:text-white">{f.title}</strong> <span className="text-xs uppercase text-slate-400">({f.severity} · {f.rule_id})</span><br /><span className="text-slate-600 dark:text-slate-300">{f.detail}</span></span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">No deceptive patterns found in this URL structure. Remember: this does <strong>not</strong> prove the destination site is safe.</p>
          )}
        </motion.section>
      )}

      {result && (
        <>
          <ResultsView result={result} input={resultInput} onReset={reset} />
          <div className="glass flex flex-wrap items-center gap-3 rounded-3xl p-5">
            <p className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Users className="h-5 w-5 text-cyan-500" /> Share safely</p>
            <button onClick={share} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-bold text-cyan-700 transition hover:bg-cyan-500/20 dark:text-cyan-300"><Share2 className="h-4 w-4" /> {copied ? 'Copied! ✓' : 'Copy redacted report'}</button>
            <button onClick={exportReport} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-bold text-cyan-700 transition hover:bg-cyan-500/20 dark:text-cyan-300"><Download className="h-4 w-4" /> Download report (.txt)</button>
            <Link to="/family" className="text-sm font-semibold text-violet-600 underline-offset-2 hover:underline dark:text-violet-300">Open Family Protection mode →</Link>
            <p className="w-full text-xs text-slate-500 dark:text-slate-400">Phone numbers, emails, UPI IDs and codes are redacted automatically. We never send the report anywhere — you share it yourself.</p>
          </div>
        </>
      )}

      {!result && !urlResult && !loading && (
        <div className="rounded-3xl border border-dashed border-sky-500/30 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Your evidence-based report will appear here: risk index, highlighted phrases, rule-by-rule explanations, URL findings and safe next steps.
        </div>
      )}
    </div>
  )
}
