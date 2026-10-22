import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ScanSearch, PlayCircle, ShieldCheck, MessageSquareWarning, Link2, ImageUp,
  Languages, LifeBuoy, GraduationCap, Lock, Eye, Zap, ChevronRight, PhoneCall,
  Landmark, Briefcase, Gift, CreditCard, UserX, TrendingUp,
} from 'lucide-react'
import { ShieldLogo } from '../components/Layout'

const fade = { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } }

const FEATURES = [
  { icon: MessageSquareWarning, title: 'Explainable detection', desc: 'Every warning is traced to the exact phrase in your message — no black-box scores.' },
  { icon: ImageUp, title: 'Screenshot OCR', desc: 'Upload a chat screenshot; text is extracted on-device or server-side and analyzed honestly.' },
  { icon: Link2, title: 'URL inspector', desc: 'Lookalike domains, shorteners, IP links & deceptive subdomains — without ever opening the link.' },
  { icon: Languages, title: '4-language safety', desc: 'English, Hindi, Hinglish & Gujarati detection patterns and a multilingual safety assistant.' },
  { icon: LifeBuoy, title: 'Emergency recovery', desc: 'Step-by-step guidance if money was sent or an OTP was shared — including helpline 1930.' },
  { icon: GraduationCap, title: 'Learn by doing', desc: 'Fictional interactive quizzes that train your scam-spotting instincts safely.' },
]

const CATEGORIES = [
  { icon: Landmark, label: 'Fake bank & KYC alerts' }, { icon: Briefcase, label: 'Fraudulent job offers' },
  { icon: Gift, label: 'Prize & lottery lures' }, { icon: CreditCard, label: 'UPI / QR payment fraud' },
  { icon: UserX, label: 'Impersonation & fake support' }, { icon: TrendingUp, label: 'Investment scams' },
]

const FAQS = [
  { q: 'Does a low risk score mean a message is safe?', a: 'No. A low score means fewer known warning patterns were found in the text. It can never guarantee a message is genuine — sender identity is not verified. Always confirm money/credential requests through official channels.' },
  { q: 'Is my message or screenshot stored?', a: 'Text is analyzed in memory by the backend and not persisted. Screenshots processed with on-device OCR never leave your browser. Scan history (if enabled) lives only in your browser\'s local storage and you can delete it anytime.' },
  { q: 'Do you open the suspicious links I submit?', a: 'Never. URL checks are pattern-based only. We do not visit, execute, or fetch submitted links, and we do not claim domain-reputation results unless such a service is configured.' },
  { q: 'Can ScamShield recover my money or freeze accounts?', a: 'No — and beware anyone who claims they can for a fee. Only your bank and law-enforcement can act. In India call 1930 immediately and report at cybercrime.gov.in.' },
  { q: 'Which languages are supported?', a: 'Detection patterns cover English, Hindi (Devanagari), Hinglish (roman Hindi) and Gujarati. The safety assistant replies in all four.' },
]

export default function Landing() {
  return (
    <div className="space-y-16 pb-4">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-sky-500/15 bg-gradient-to-b from-sky-500/[0.07] to-transparent px-5 pb-10 pt-10 text-center sm:px-10 sm:pt-14">
        <motion.div {...fade} className="floaty mx-auto mb-5 w-fit"><ShieldLogo size={72} /></motion.div>
        <motion.p {...fade} className="mx-auto mb-4 w-fit rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-300">
          SCAN → DETECT → EXPLAIN → PROTECT
        </motion.p>
        <motion.h1 {...fade} className="mx-auto max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          One Click Can Change Everything. <span className="text-gradient">Check Before You Trust.</span>
        </motion.h1>
        <motion.p {...fade} className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
          ScamShield AI analyzes suspicious SMS, WhatsApp messages, emails, screenshots and links — then explains
          <em> exactly which phrases</em> look dangerous and what to do next. Free, private, and built for everyone.
        </motion.p>
        <motion.div {...fade} className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/scan" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 px-6 py-3.5 font-bold text-white shadow-xl shadow-cyan-500/30 transition hover:brightness-110">
            <ScanSearch className="h-5 w-5" /> Scan a Message
          </Link>
          <Link to="/scan?demo=banking" className="inline-flex items-center gap-2 rounded-2xl border border-violet-500/40 bg-violet-500/10 px-6 py-3.5 font-bold text-violet-700 transition hover:bg-violet-500/20 dark:text-violet-300">
            <PlayCircle className="h-5 w-5" /> Try Live Demo
          </Link>
        </motion.div>

        {/* Scanner preview card */}
        <motion.div {...fade} className="glass glow-ring relative mx-auto mt-10 max-w-xl overflow-hidden rounded-3xl p-5 text-left">
          <div className="scan-beam pointer-events-none absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent" aria-hidden="true" />
          <p className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Live scanner preview <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-extrabold text-rose-500">HIGH WARNING · 87</span>
          </p>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            “Dear customer, your account will be{' '}
            <mark className="rounded bg-rose-500/25 px-0.5 font-semibold text-rose-700 dark:text-rose-200">blocked within 2 hours</mark>.{' '}
            <mark className="rounded bg-rose-500/25 px-0.5 font-semibold text-rose-700 dark:text-rose-200">Share the OTP</mark> to verify your KYC…”
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-rose-600 dark:text-rose-300">OTP REQUEST</span>
            <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-2 py-1 text-orange-600 dark:text-orange-300">ACCOUNT THREAT</span>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-600 dark:text-amber-300">FAKE KYC</span>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section aria-labelledby="how">
        <h2 id="how" className="mb-6 text-center text-2xl font-extrabold text-slate-900 dark:text-white">How ScamShield protects you</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: '01 · SCAN', icon: ScanSearch, desc: 'Paste a message, enter a URL, or upload a screenshot. Remove personal details first.' },
            { step: '02 · DETECT', icon: Zap, desc: 'Contextual rules check for OTP theft, fake KYC, payment traps, urgency & lookalike links.' },
            { step: '03 · EXPLAIN', icon: Eye, desc: 'See the exact suspicious phrases highlighted with plain-language reasons and a 0–100 risk index.' },
            { step: '04 · PROTECT', icon: ShieldCheck, desc: 'Follow safe next steps, share a redacted report with family, or get emergency guidance.' },
          ].map((s, i) => (
            <motion.article key={s.step} {...fade} transition={{ duration: 0.5, delay: i * 0.08 }} className="glass rounded-3xl p-5">
              <s.icon className="mb-3 h-7 w-7 text-cyan-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white">{s.step}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section aria-labelledby="features">
        <h2 id="features" className="mb-6 text-center text-2xl font-extrabold text-slate-900 dark:text-white">Built for real-world scams</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.article key={f.title} {...fade} transition={{ duration: 0.5, delay: i * 0.06 }} className="glass group rounded-3xl p-5 transition hover:border-cyan-400/40">
              <span className="mb-3 inline-flex rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 p-3 text-cyan-500"><f.icon className="h-6 w-6" /></span>
              <h3 className="font-bold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section aria-labelledby="cats" className="glass rounded-[2rem] p-6 sm:p-8">
        <h2 id="cats" className="mb-2 text-xl font-extrabold text-slate-900 dark:text-white">Scam categories we watch for</h2>
        <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">Detection combines multiple contextual signals — a single keyword never convicts a message on its own.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <p key={c.label} className="flex items-center gap-3 rounded-2xl bg-slate-900/[0.04] px-4 py-3 font-medium text-slate-800 dark:bg-white/5 dark:text-slate-100">
              <c.icon className="h-5 w-5 shrink-0 text-violet-500" /> {c.label}
            </p>
          ))}
        </div>
      </section>

      {/* PRIVACY */}
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center" aria-labelledby="privacy">
        <div>
          <h2 id="privacy" className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white"><Lock className="h-6 w-6 text-cyan-500" /> Privacy by design</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <li>• We <strong>never ask</strong> for your OTP, PIN, password, or card details — anyone who does is a scammer.</li>
            <li>• Submitted text is analyzed in memory and not stored on a server; screenshots are not saved by default.</li>
            <li>• Optional scan history stays in your browser only; delete it anytime from History or Settings.</li>
            <li>• Submitted links are never opened or executed.</li>
          </ul>
        </div>
        <a href="tel:1930" className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-rose-500 to-orange-500 px-6 py-5 font-extrabold text-white shadow-xl shadow-rose-500/25 transition hover:brightness-110">
          <PhoneCall className="h-8 w-8" /> <span>Already lost money?<br /><span className="text-2xl">Call 1930 now</span></span>
        </a>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq">
        <h2 id="faq" className="mb-5 text-2xl font-extrabold text-slate-900 dark:text-white">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="glass group rounded-2xl px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-slate-900 dark:text-white">
                {f.q} <ChevronRight className="h-5 w-5 shrink-0 transition group-open:rotate-90" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/scan" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-7 py-3.5 font-bold text-white shadow-xl shadow-cyan-500/25 transition hover:brightness-110">
            Start protecting yourself — it&apos;s free <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
