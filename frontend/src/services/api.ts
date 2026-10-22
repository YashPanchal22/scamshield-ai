/**
 * API client. Primary path = FastAPI backend (relative /api, proxied by Vite /
 * reverse proxy in deployment). If the backend is unreachable we fall back to
 * the on-device rule engine and clearly label results — never fake a server result.
 */
import type { AnalyzeResponse, AssistantResponse, UrlCheckResponse } from '../types'
import { analyzeTextLocal, analyzeUrlLocal } from './localEngine'

const API_BASE: string = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE as string) || ''

function isUnavailable(err: unknown): boolean {
  if (err instanceof TypeError) return true
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    return (
      msg.includes('404') ||
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('load failed') ||
      msg.includes('server error (404)') ||
      msg.includes('server error (502)') ||
      msg.includes('server error (503)') ||
      msg.includes('server error (504)')
    )
  }
  return false
}

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
    if (isUnavailable(err)) return analyzeTextLocal(text, language)
    throw err
  }
}

export async function analyzeUrl(url: string): Promise<UrlCheckResponse> {
  try {
    const data = await postJson<UrlCheckResponse>('/api/analyze/url', { url })
    return { ...data, engine_source: 'FastAPI backend' }
  } catch (err) {
    if (isUnavailable(err)) return analyzeUrlLocal(url)
    throw err
  }
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

export async function analyzeImage(file: File, language: string, onProgress?: (pct: number) => void): Promise<AnalyzeResponse> {
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_BASE}/api/analyze/image?language=${encodeURIComponent(language)}`, { method: 'POST', body: form })
    if (res.ok) {
      const data = (await res.json()) as AnalyzeResponse
      return { ...data, engine_source: 'FastAPI backend (server OCR)' }
    }
  } catch {
    /* fallback to local OCR */
  }

  // Graceful fallback to client-side OCR with Tesseract.js:
  const ocrText = await ocrOnDevice(file, language, onProgress)
  const res = analyzeTextLocal(ocrText || 'No readable text detected in screenshot.', language)
  return { ...res, extracted_text: ocrText, ocr_engine: 'Tesseract.js (on-device fallback)' }
}

function getLocalAssistantReply(message: string): AssistantResponse {
  const m = message.toLowerCase()
  if (m.includes('otp') || m.includes('pin') || m.includes('cvv') || m.includes('password')) {
    return {
      reply:
        '🚨 NEVER share your OTP, PIN, password, or CVV with anyone. Real bank managers, customer support agents, and police officers will NEVER ask for your OTP. If you already gave an OTP, call your bank customer care immediately to freeze your account and card.',
      checklist: [
        'Do NOT share the OTP or screenshot of SMS',
        'If already shared, immediately call your bank to freeze net banking & debit card',
        'Change banking passwords from a safe device',
        'Report the fraudulent number at cybercrime.gov.in and dial 1930',
      ],
      suggested_questions: ['I already gave the OTP — what should I do right now?', 'How do I block my debit/credit card?'],
      source: 'On-device safety advisor (offline/demo mode)',
    }
  }
  if (m.includes('sent money') || m.includes('paid') || m.includes('lost') || m.includes('scammed') || m.includes('cheated') || m.includes('transferred')) {
    return {
      reply:
        '⚠️ EMERGENCY ACTION REQUIRED: The first 2 to 3 hours (the "Golden Hours") are critical to freezing the stolen funds before the scammer withdraws them!',
      checklist: [
        'Call 1930 (National Cyber Crime Reporting Helpline) immediately',
        'Call your bank helpline to report an unauthorized/fraudulent transaction and note the complaint reference number',
        'File an official cyber fraud complaint at https://cybercrime.gov.in',
        'Take screenshots of transaction IDs, SMS, WhatsApp chats, and scammer profiles',
      ],
      suggested_questions: ['What information do I need when calling 1930?', 'Will my bank refund the money?'],
      source: 'On-device safety advisor (offline/demo mode)',
    }
  }
  if (m.includes('arrest') || m.includes('police') || m.includes('cbi') || m.includes('customs') || m.includes('parcel')) {
    return {
      reply:
        '🚨 THIS IS A "DIGITAL ARREST" SCAM. There is NO legal term or procedure called "digital arrest" in India or anywhere else. Law enforcement, CBI, Customs, and Police NEVER conduct court trials on Skype/WhatsApp video calls, and NEVER ask for money or fund transfers to "RBI safety accounts". Disconnect immediately!',
      checklist: [
        'Disconnect the call immediately and block the caller',
        'Do NOT transfer any money or provide bank credentials',
        'Police and courts never conduct arrests over video call',
        'Report the phone number on Chakshu (sancharsaathi.gov.in) and call 1930',
      ],
      suggested_questions: ['Why are they wearing police uniforms on video?', 'Can police really freeze my Aadhaar?'],
      source: 'On-device safety advisor (offline/demo mode)',
    }
  }
  if (m.includes('kyc') || m.includes('sbi') || m.includes('hdfc') || m.includes('icici') || m.includes('pan') || m.includes('account block') || m.includes('freeze')) {
    return {
      reply:
        '⚠️ Fake KYC alert warning. Banks NEVER send SMS with .apk downloads or unofficial links (like sbi-update.xyz) threatening that your account will be suspended within 2 hours. This is a credential theft campaign.',
      checklist: [
        'Do not click the link or install any APK file',
        'Update KYC only by visiting your physical bank branch or official net banking portal',
        'Check your account status by opening the official bank app directly',
        'Forward the fraudulent SMS to 1909 or report it to your telecom provider',
      ],
      suggested_questions: ['How can I check if my KYC is really expired?', 'What is Chakshu portal?'],
      source: 'On-device safety advisor (offline/demo mode)',
    }
  }
  if (m.includes('job') || m.includes('task') || m.includes('telegram') || m.includes('work from home') || m.includes('youtube')) {
    return {
      reply:
        '⚠️ Fake Task / Work-From-Home Scam: Scammers ask you to like YouTube videos, write hotel reviews, or do data entry, then pay small rewards (Rs 150-500) to build trust before demanding "prepaid tasks" of Rs 10,000+ where your money is trapped. Real employers NEVER charge registration or investment fees!',
      checklist: [
        'Never pay money to receive salary or job offers',
        'Stop sending any money to Telegram group admins',
        'Do not share PAN, Aadhaar, or bank cancel cheques with unverified Telegram recruiters',
        'Report the Telegram/WhatsApp channel to cybercrime.gov.in',
      ],
      suggested_questions: ['They paid me Rs 300 first — why is it a scam?', 'How to recognize a fake job offer?'],
      source: 'On-device safety advisor (offline/demo mode)',
    }
  }
  return {
    reply:
      'I am your ScamShield AI Safety Advisor. Here are the golden safety rules to protect yourself:\n1. Receiving money NEVER requires entering your UPI PIN or scanning a QR code.\n2. Never share OTPs, passwords, or CVVs with anyone, even if they claim to be from your bank or government.\n3. Beware of fake KYC alerts and "digital arrest" threats.\n4. If you have been scammed, immediately dial 1930 and visit cybercrime.gov.in.',
    checklist: [
      'Pause before reacting to urgent messages',
      'Verify unexpected messages directly with the official company',
      'Never install screen-sharing apps (AnyDesk, RustDesk) at a caller\'s request',
      'Call 1930 immediately in case of financial fraud',
    ],
    suggested_questions: [
      'Someone is asking me for an OTP',
      'I received a message saying my bank account will be blocked',
      'Someone wants to send me money via QR code',
    ],
    source: 'On-device safety advisor (offline/demo mode)',
  }
}

export async function askAssistant(message: string, language: string): Promise<AssistantResponse> {
  try {
    return await postJson<AssistantResponse>('/api/assistant', { message, language })
  } catch (err) {
    if (isUnavailable(err)) {
      return getLocalAssistantReply(message)
    }
    throw err
  }
}
