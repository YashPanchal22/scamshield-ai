import { createContext, useContext } from 'react'
import type { ScanRecord } from '../types'

const HISTORY_KEY = 'scamshield.history.v1'
const SETTINGS_KEY = 'scamshield.settings.v1'
const PROGRESS_KEY = 'scamshield.learning.v1'

export interface Settings {
  theme: 'dark' | 'light'
  language: string
  saveHistory: boolean
  retentionDays: number
}

export const DEFAULT_SETTINGS: Settings = { theme: 'dark', language: 'auto', saveHistory: true, retentionDays: 30 }

function safeParse<T>(raw: string | null, fallback: T): T {
  try { return raw ? (JSON.parse(raw) as T) : fallback } catch { return fallback }
}

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...safeParse<Settings>(localStorage.getItem(SETTINGS_KEY), DEFAULT_SETTINGS) }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export function loadHistory(): ScanRecord[] {
  return safeParse<ScanRecord[]>(localStorage.getItem(HISTORY_KEY), [])
}

export function addHistory(record: ScanRecord): ScanRecord[] {
  const settings = loadSettings()
  if (!settings.saveHistory) return loadHistory()
  const cutoff = Date.now() - settings.retentionDays * 24 * 3600 * 1000
  const next = [record, ...loadHistory()].filter((r) => new Date(r.created_at).getTime() >= cutoff).slice(0, 100)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  return next
}

export function deleteHistory(id: string): ScanRecord[] {
  const next = loadHistory().filter((r) => r.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  return next
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

export interface LearningProgress { answered: number; correct: number; completedIds: string[] }

export function loadProgress(): LearningProgress {
  return safeParse<LearningProgress>(localStorage.getItem(PROGRESS_KEY), { answered: 0, correct: 0, completedIds: [] })
}

export function saveProgress(p: LearningProgress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
}

/** Redact obvious sensitive identifiers before sharing/export. */
export function redactSensitive(text: string): string {
  return text
    .replace(/\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g, '[PHONE REDACTED]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD REDACTED]')
    .replace(/\b\d{4}\s\d{4}\s\d{4}\b/g, '[ID REDACTED]')
    .replace(/\b[A-Za-z0-9._%+-]+@(?:okaxis|okhdfcbank|okicici|oksbi|paytm|ybl|axl|ibl|sbi|upi)\b/gi, '[UPI ID REDACTED]')
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, '[EMAIL REDACTED]')
    .replace(/\b(OTP|code|pin|password)\s*(?:is|:|=)?\s*\d{4,8}\b/gi, '$1 [REDACTED]')
}

export function buildShareReport(record: ScanRecord): string {
  const r = record.result
  return [
    `ScamShield AI — Safety Report (shared with sender's consent)`,
    `Date: ${new Date(record.created_at).toLocaleString()}`,
    `Risk index: ${r.risk_index}/100 (${r.risk_level.toUpperCase()} warning) — experimental indicator, not a probability of fraud.`,
    `Suspected category: ${r.suspected_category}`,
    ``,
    `Message examined (sensitive details redacted):`,
    redactSensitive(record.input).slice(0, 1200),
    ``,
    `Warning signals found:`,
    ...(r.signals.length ? r.signals.map((s) => `- ${s.category}: ${s.explanation} (Evidence: "${redactSensitive(s.excerpt)}")`) : ['- None detected by the rule engine.']),
    ``,
    `Recommended actions:`,
    ...r.recommended_actions.map((a) => `- ${a}`),
    ``,
    `Note: ${r.uncertainty_statement}`,
    `India cyber-fraud helpline: 1930 | Report: https://cybercrime.gov.in`,
  ].join('\n')
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const SettingsContext = createContext<{ settings: Settings; update: (s: Settings) => void }>({
  settings: DEFAULT_SETTINGS,
  update: () => undefined,
})
export const useSettings = () => useContext(SettingsContext)
