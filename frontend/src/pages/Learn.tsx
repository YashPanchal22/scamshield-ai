import { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight } from 'lucide-react'
import { QUIZ } from '../data/demo'
import { loadProgress, saveProgress, type LearningProgress } from '../lib/store'

export default function Learn() {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [session, setSession] = useState({ answered: 0, correct: 0, finished: false })
  const [progress, setProgress] = useState<LearningProgress>(() => loadProgress())

  const q = QUIZ[index]
  const revealed = selected !== null

  function answer(opt: number) {
    if (revealed) return
    setSelected(opt)
    const right = opt === q.correct
    const next = {
      answered: progress.answered + 1,
      correct: progress.correct + (right ? 1 : 0),
      completedIds: progress.completedIds.includes(q.id) ? progress.completedIds : [...progress.completedIds, q.id],
    }
    setProgress(next)
    saveProgress(next)
    setSession((s) => ({ ...s, answered: s.answered + 1, correct: s.correct + (right ? 1 : 0) }))
  }

  function nextQ() {
    if (index + 1 >= QUIZ.length) setSession((s) => ({ ...s, finished: true }))
    else { setIndex(index + 1); setSelected(null) }
  }

  function restart() { setIndex(0); setSelected(null); setSession({ answered: 0, correct: 0, finished: false }) }
  function resetProgress() { const p = { answered: 0, correct: 0, completedIds: [] }; setProgress(p); saveProgress(p); restart() }

  const pct = Math.round((progress.completedIds.length / QUIZ.length) * 100)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white"><GraduationCap className="h-8 w-8 text-violet-500" /> Cyber-Safety Learning Center</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Practice on <strong>fictional</strong> scam scenarios — bank alerts, job offers, phishing, impersonation and tricky URLs. No real malicious sites, ever. Learn the pattern once, spot it forever.</p>
      </header>

      <div className="glass rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold text-slate-900 dark:text-white">Your learning progress: {progress.completedIds.length}/{QUIZ.length} challenges · {progress.correct}/{progress.answered} correct answers</p>
          <button onClick={resetProgress} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-500"><RotateCcw className="h-4 w-4" /> Reset progress</button>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Learning progress">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {session.finished ? (
        <motion.section initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass glow-ring rounded-[1.75rem] p-8 text-center" aria-live="polite">
          <Trophy className="mx-auto mb-3 h-14 w-14 text-amber-400" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Quiz complete — {session.correct}/{session.answered} correct!</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {session.correct === session.answered ? 'Perfect score. You recognised every manipulation pattern — now teach a family member!' : session.correct >= session.answered * 0.6 ? 'Strong instincts. Review the explanations for the ones you missed and try again.' : 'These tricks fool millions — that is exactly why practice matters. Replay the quiz and read each explanation carefully.'}
          </p>
          <button onClick={restart} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3 font-bold text-white shadow-xl shadow-cyan-500/25 transition hover:brightness-110"><RotateCcw className="h-5 w-5" /> Retry quiz</button>
        </motion.section>
      ) : (
        <section className="glass glow-ring rounded-[1.75rem] p-5 sm:p-7" aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-violet-600 dark:text-violet-300">{q.category} · Fictional scenario</span>
            <span className="text-sm font-semibold text-slate-500">Question {index + 1} of {QUIZ.length} · Score this run: {session.correct}/{session.answered}</span>
          </div>

          <blockquote className="rounded-2xl border-l-4 border-cyan-500 bg-slate-900/[0.04] px-5 py-4 leading-relaxed text-slate-800 dark:bg-white/[0.05] dark:text-slate-100">{q.scenario}</blockquote>
          <h2 className="mt-5 text-lg font-extrabold text-slate-900 dark:text-white">{q.question}</h2>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2" role="group" aria-label="Answer options">
            {q.options.map((opt, i) => {
              const isCorrect = revealed && i === q.correct
              const isWrong = revealed && selected === i && i !== q.correct
              return (
                <button key={i} onClick={() => answer(i)} disabled={revealed} aria-pressed={selected === i}
                  className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold leading-relaxed transition ${
                    isCorrect ? 'border-emerald-500/60 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200'
                    : isWrong ? 'border-rose-500/60 bg-rose-500/12 text-rose-800 dark:text-rose-200'
                    : 'border-sky-500/20 text-slate-700 hover:border-cyan-400/50 hover:bg-cyan-500/[0.06] dark:text-slate-200'
                  } ${revealed && !isCorrect && !isWrong ? 'opacity-55' : ''}`}>
                  {isCorrect ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : isWrong ? <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" /> : <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sky-500/40 text-[11px] font-extrabold">{String.fromCharCode(65 + i)}</span>}
                  {opt}
                </button>
              )
            })}
          </div>

          {revealed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 rounded-2xl px-5 py-4 text-sm leading-relaxed ${selected === q.correct ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' : 'bg-amber-500/10 text-amber-800 dark:text-amber-200'}`}>
              <strong>{selected === q.correct ? 'Correct! ' : 'Not quite. '}</strong>{q.explanation}
              <div className="mt-3">
                <button onClick={nextQ} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110">
                  {index + 1 >= QUIZ.length ? 'See my result' : 'Next question'} <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3" aria-label="Golden safety rules">
        {[
          { t: 'Golden Rule 1', d: 'OTP, PIN and passwords are yours alone. Anyone asking = a scammer. No exceptions, ever.' },
          { t: 'Golden Rule 2', d: 'Urgency is a weapon. "Act in 2 hours or else" means: stop, breathe, verify officially.' },
          { t: 'Golden Rule 3', d: 'Money only flows one way with a PIN: out. Receiving money/refunds never needs a PIN or QR scan.' },
        ].map((r) => (
          <article key={r.t} className="glass rounded-3xl p-5">
            <h3 className="font-extrabold text-slate-900 dark:text-white">{r.t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{r.d}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
