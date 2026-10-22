import { useEffect, useRef, useState } from 'react'
import { MessageCircleHeart, SendHorizontal, Loader2, ListChecks, Bot, User, Sparkles } from 'lucide-react'
import { askAssistant } from '../services/api'

interface Msg { role: 'user' | 'bot'; text: string; checklist?: string[]; source?: string }

const GREETING: Record<string, string> = {
  en: "Hello! I'm your Safety Assistant. Ask me about OTP safety, verifying job offers, safe payments, or what to do if money was already sent. I work without any paid AI service — answers come from a curated rule-based safety knowledge base.",
  hi: 'नमस्ते! मैं आपका सुरक्षा सहायक हूँ। OTP सुरक्षा, नौकरी ऑफर सत्यापन, या पैसे जाने पर क्या करें — मुझसे पूछें।',
  hinglish: 'Namaste! Main aapka Safety Assistant hoon. OTP safety, job offer verify karna, ya paise chale gaye toh kya karein — mujhse poochho.',
  gu: 'નમસ્તે! હું તમારો સુરક્ષા સહાયક છું. OTP સુરક્ષા, નોકરી ઓફર ચકાસણી, કે પૈસા ગયા હોય તો શું કરવું — મને પૂછો.',
}

export default function Assistant() {
  const [language, setLanguage] = useState('en')
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'bot', text: GREETING.en }])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([
    'Someone is asking for my OTP — what should I do?',
    'I already sent money to a scammer. What now?',
    'Do I need a UPI PIN to receive a refund?',
    'How do I verify a job offer?',
    'I clicked a suspicious link. Am I safe?',
  ])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

  useEffect(() => {
    setMsgs([{ role: 'bot', text: GREETING[language] || GREETING.en }])
  }, [language])

  async function send(textRaw?: string) {
    const text = (textRaw ?? input).trim()
    if (!text || loading) return
    setInput('')
    setMsgs((m) => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const res = await askAssistant(text, language)
      setMsgs((m) => [...m, { role: 'bot', text: res.reply, checklist: res.checklist, source: res.source }])
      setSuggestions(res.suggested_questions)
    } catch {
      setMsgs((m) => [...m, { role: 'bot', text: 'Something went wrong while answering. The essential rule never changes: never share OTP/PINs, verify via official channels, and in India call 1930 if money is lost.', source: 'error fallback' }])
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white"><MessageCircleHeart className="h-8 w-8 text-cyan-500" /> Multilingual Safety Assistant</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Plain-language guidance in English, Hindi, Hinglish &amp; Gujarati. Runs on a rule-based knowledge base — no API key needed, no keys in the browser.</p>
        </div>
        <div>
          <label htmlFor="alang" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Assistant language</label>
          <select id="alang" value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-xl border border-sky-500/20 bg-white px-3 py-2.5 text-sm font-medium dark:bg-[#0b1428]">
            <option value="en">English</option><option value="hi">Hindi (हिंदी)</option><option value="hinglish">Hinglish</option><option value="gu">Gujarati (ગુજરાતી)</option>
          </select>
        </div>
      </header>

      <section className="glass glow-ring flex h-[560px] flex-col rounded-[1.75rem] p-4 sm:p-5" aria-label="Chat with safety assistant">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-violet-500/20 text-violet-600 dark:text-violet-300' : 'bg-gradient-to-br from-cyan-500 to-violet-500 text-white'}`} aria-hidden="true">
                {m.role === 'user' ? <User className="h-4.5 w-4.5" /> : <Bot className="h-5 w-5" />}
              </span>
              <div className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'rounded-tr-md bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white' : 'rounded-tl-md bg-slate-900/[0.05] text-slate-800 dark:bg-white/[0.07] dark:text-slate-100'}`}>
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.checklist && m.checklist.length > 0 && (
                  <div className="mt-3 rounded-2xl bg-white/60 px-3.5 py-3 dark:bg-black/25">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide"><ListChecks className="h-4 w-4 text-cyan-600 dark:text-cyan-300" /> Safety checklist</p>
                    <ul className="list-disc space-y-1 pl-4 text-[13px]">{m.checklist.map((c, j) => <li key={j}>{c}</li>)}</ul>
                  </div>
                )}
                {m.source && <p className="mt-2 text-[10px] uppercase tracking-wide opacity-60">Source: {m.source}</p>}
              </div>
            </div>
          ))}
          {loading && <p className="flex items-center gap-2 pl-12 text-sm text-slate-500" role="status"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</p>}
          <div ref={bottomRef} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested questions">
          {suggestions.slice(0, 5).map((s) => (
            <button key={s} onClick={() => send(s)} className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-sky-500/10 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" /> {s}
            </button>
          ))}
        </div>

        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send() }}>
          <label htmlFor="chat" className="sr-only">Ask a safety question</label>
          <input id="chat" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask: 'A caller asked me to install AnyDesk'…" maxLength={2000}
            className="flex-1 rounded-2xl border border-sky-500/20 bg-white/80 px-4 py-3 text-sm outline-none focus:border-cyan-400 dark:bg-[#0b1428]/80" />
          <button type="submit" disabled={loading || !input.trim()} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110 disabled:opacity-50" aria-label="Send message">
            <SendHorizontal className="h-4.5 w-4.5" /> <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        <p className="mt-2 text-center text-[11px] text-slate-500">The assistant gives general safety education, not legal/financial advice. Treat pasted scam text as untrusted data — analyze it in the Scanner.</p>
      </section>
    </div>
  )
}
