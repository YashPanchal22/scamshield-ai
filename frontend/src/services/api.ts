/**
 * API client. Primary path = FastAPI backend (relative /api, proxied by Vite /
 * reverse proxy in deployment). If the backend is unreachable we fall back to
 * the on-device rule engine and clearly label results — never fake a server result.
 */
import type { AnalyzeResponse, AssistantResponse, UrlCheckResponse } from '../types'
import { analyzeTextLocal, analyzeUrlLocal } from './localEngine'

const API_BASE: string = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE as string) || ''

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let detail = `Server error (${res.status})`
    try { detail = (await res.json())?.detail || detail } catch { /* keep default */ }
    throw new Error(typeof detail === 'string' ? detail : 'Request validation failed. Please check your input.')
  }
  return res.json() as Promise<T>
}

export async function apiHealth(): Promise<{ ok: boolean; ocr: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    if (!res.ok) return { ok: false, ocr: false }
    const data = await res.json()
    return { ok: data.status === 'ok', ocr: !!data.ocr_available }
  } catch {
    return { ok: false, ocr: false }
  }
}

export async function analyzeText(text: string, language: string): Promise<AnalyzeResponse> {
  try {
    const data = await postJson<AnalyzeResponse>('/api/analyze/text', { text, language, source: 'text' })
    return { ...data, engine_source: 'FastAPI backend' }
  } catch (err) {
    // Network failure only → honest on-device fallback. Validation errors re-throw.
    if (err instanceof TypeError) return analyzeTextLocal(text, language)
    throw err
  }
}

export async function analyzeUrl(url: string): Promise<UrlCheckResponse> {
  try {
    const data = await postJson<UrlCheckResponse>('/api/analyze/url', { url })
    return { ...data, engine_source: 'FastAPI backend' }
  } catch (err) {
    if (err instanceof TypeError) return analyzeUrlLocal(url)
    throw err
  }
}

export async function analyzeImage(file: File, language: string): Promise<AnalyzeResponse> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/api/analyze/image?language=${encodeURIComponent(language)}`, { method: 'POST', body: form })
  if (!res.ok) {
    let detail = `Server error (${res.status})`
    try { detail = (await res.json())?.detail || detail } catch { /* noop */ }
    throw new Error(detail)
  }
  const data = (await res.json()) as AnalyzeResponse
  return { ...data, engine_source: 'FastAPI backend (server OCR)' }
}

/** On-device OCR with Tesseract.js — the screenshot never leaves the device. */
export async function ocrOnDevice(file: File, language: string, onProgress?: (pct: number) => void): Promise<string> {
  const Tesseract = await import('tesseract.js')
  const langMap: Record<string, string> = { hi: 'eng+hin', gu: 'eng+guj', hinglish: 'eng+hin' }
  const lang = langMap[language] || 'eng'
  const { data } = await Tesseract.recognize(file, lang, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(Math.round(m.progress * 100))
    },
  })
  return (data?.text || '').trim()
}

export async function askAssistant(message: string, language: string): Promise<AssistantResponse> {
  try {
    return await postJson<AssistantResponse>('/api/assistant', { message, language })
  } catch (err) {
    if (err instanceof TypeError) {
      return {
        reply:
          'I could not reach the assistant server, so here is the essential safety guidance: never share OTP/PIN/passwords; receiving money never needs a PIN; verify unexpected requests via official apps. If money was already sent in India, call 1930 immediately and report at cybercrime.gov.in.',
        checklist: ['Never share OTP/PIN/passwords', 'Verify via official apps only', 'If money sent: call 1930 + your bank now'],
        suggested_questions: ['Someone asked for my OTP', 'I already sent money — what now?'],
        source: 'offline fallback (backend unreachable)',
      }
    }
    throw err
  }
}
