/**
 * On-device fallback engine — a TypeScript mirror of the FastAPI rules.
 * Used ONLY when the backend is unreachable, and every result produced here is
 * clearly labelled "on-device fallback". Same contextual-rule philosophy:
 * no bare keyword fires a high-severity signal.
 */
import type { AnalyzeResponse, Signal, UrlCheckResponse, UrlFinding } from '../types'

const URL_RE =
  /\b(?:https?:\/\/|www\.)[^\s<>"]+|\b[a-zA-Z0-9-]+\.(?:com|in|net|org|io|xyz|top|click|live|site|online|info|co|me|link|buzz|tk|ml|cf|ga|gq|ru|su|work|support|help|verify|secure)\b[^\s<>"]*/gi

const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'rb.gy', 'cutt.ly', 'shorturl.at', 'is.gd', 'tiny.cc', 'rebrand.ly', 'ow.ly', 'buff.ly', 's.id'])
const BRANDS = ['sbi', 'hdfc', 'icici', 'axis', 'kotak', 'pnb', 'paytm', 'phonepe', 'gpay', 'amazon', 'flipkart', 'paypal', 'apple', 'microsoft', 'netflix', 'instagram', 'facebook', 'whatsapp', 'rbi', 'uidai', 'aadhaar', 'npci', 'upi']
const SUS_TLDS = ['.xyz', '.top', '.click', '.buzz', '.tk', '.ml', '.cf', '.ga', '.gq', '.work', '.live', '.site']

interface Rule {
  id: string
  category: string
  re: RegExp
  explanation: string
  action: string
  weight: number
}

const RULES: Rule[] = [
  { id: 'OTP_REQUEST', category: 'OTP / Credential Theft', re: /\b(otp|one[\s-]?time password|verification code|ओटीपी|ઓટીપી)\b.{0,40}\b(share|send|batao|बताओ|enter|submit|provide|bhejo|भेजो|આપો|મોકલો)\b|\b(share|send|batao|बताओ|enter|bhejo)\b.{0,25}\b(otp|ओटीपी|ઓટીપી)\b/i,
    explanation: 'The message asks you to share an OTP. Banks never ask for OTPs over calls, SMS, or chats.', action: 'Never share the OTP. Contact your bank via its official app/number.', weight: 35 },
  { id: 'PIN_PASSWORD_REQUEST', category: 'OTP / Credential Theft', re: /\b(share|send|enter|provide|batao)\b.{0,30}\b(pin|password|cvv|atm pin|upi pin|पासवर्ड)\b/i,
    explanation: 'The message requests a PIN, password, or CVV. No legitimate organisation asks for these secrets.', action: 'Do not share any PIN/password/CVV. Change it from a trusted device if already shared.', weight: 35 },
  { id: 'ACCOUNT_THREAT', category: 'Bank Impersonation', re: /\b(account|card|खाता|ખાતું|kyc|sim|number)\b.{0,40}\b(block|blocked|suspend|suspended|freeze|frozen|deactivat|band|बंद|બંધ|close|hold)\b/i,
    explanation: 'Threats of immediate account/card blocking are a classic pressure tactic.', action: 'Do not act on the message. Check status in your official bank app.', weight: 28 },
  { id: 'FAKE_KYC', category: 'Fake KYC Alert', re: /\b(kyc|e-?kyc|केवाईसी)\b.{0,40}\b(update|verify|pending|expire|complete|required|submit)\b|\b(update|verify)\b.{0,20}\b(kyc|केवाईसी)\b/i,
    explanation: 'Fake KYC-update alerts are widely used to steal banking credentials via lookalike forms.', action: 'Update KYC only inside the official app or at a branch — never via message links.', weight: 26 },
  { id: 'PRIZE_SCAM', category: 'Prize / Lottery Scam', re: /\b(you (have )?won|winner|lottery|prize|lucky draw|ઈનામ)\b.{0,60}(₹|\$|rs\.?|rupees|lakh|crore|iphone|gift|claim)|\bcongratulations\b.{0,50}\b(won|winner|prize|lottery|lucky draw)\b/i,
    explanation: 'Unexpected prize claims you never entered are a well-known lure; claiming usually requires a fee.', action: 'Do not pay any fee or share details to claim a prize.', weight: 28 },
  { id: 'ADVANCE_FEE_JOB', category: 'Fake Job Offer', re: /\b(job|vacancy|hiring|recruit|नौकरी|નોકરી|offer letter|work from home)\b.{0,90}\b(registration fee|security deposit|advance|processing fee|pay|fee)\b|\b(pay|deposit)\b.{0,30}(₹|\$|rs\.?).{0,50}\b(job|training|registration)\b/i,
    explanation: 'Legitimate employers do not ask candidates to pay fees before joining.', action: 'Verify the employer on its official careers page. Never pay to get a job.', weight: 30 },
  { id: 'PAYMENT_DEMAND', category: 'Payment / UPI Fraud', re: /\b(pay|transfer|send|भेजो|મોકલો)\b.{0,30}(₹|\$|rs\.?)\s?[\d,]+|\b(qr code)\b.{0,40}\b(scan|pay|send)\b.{0,30}\b(receive|refund)\b/i,
    explanation: 'Receiving money never requires scanning a QR or entering a UPI PIN — that always sends money.', action: 'Never enter your UPI PIN to receive money. Verify the payee independently.', weight: 27 },
  { id: 'REMOTE_ACCESS', category: 'Remote-Access Scam', re: /\b(anydesk|teamviewer|quick ?support|rustdesk|screen ?share|remote access)\b|\b(install|download)\b.{0,30}\bapp\b.{0,40}\b(refund|support|verify|kyc)\b/i,
    explanation: 'Remote-access apps let scammers watch your OTPs and control your phone.', action: "Never install remote-access apps at a stranger's request.", weight: 34 },
  { id: 'INVESTMENT_SCAM', category: 'Investment Scam', re: /\b(guaranteed|double|triple|100%)\b.{0,40}\b(return|profit|money)\b|\b(crypto|trading|forex|investment)\b.{0,60}\b(double|guaranteed|daily profit)\b/i,
    explanation: 'Guaranteed / double-money promises are illegal lures; genuine investments carry risk.', action: 'Check SEBI/regulator registration. Avoid unknown trading groups.', weight: 28 },
  { id: 'URGENCY', category: 'Urgency / Manipulation', re: /\b(urgent|immediately|within \d+ (hours?|minutes?)|last warning|act now|तुरंत|अभी|turant|abhi karo)\b/i,
    explanation: 'Artificial urgency is designed to make you act before verifying.', action: 'Pause and verify through official channels.', weight: 16 },
  { id: 'AUTHORITY_THREAT', category: 'Impersonation / Digital-Arrest Scam', re: /\b(police|cbi|customs|income tax|court|arrest|legal action|digital arrest)\b.{0,60}\b(pay|transfer|fine|arrest|case|immediately)\b|\b(digital arrest)\b/i,
    explanation: "'Digital arrest' threats demanding payment are impersonation — police never demand money on video calls.", action: 'Disconnect. Verify via local police / helpline 1930 (India).', weight: 30 },
  { id: 'GENERIC_PHISHING_LINK', category: 'Phishing', re: /\b(click (here|the link)|tap (here|the link))\b.{0,50}\b(verify|update|claim|login|unlock|kyc)\b/i,
    explanation: 'Directing you to click a link to verify/claim/unlock is the standard phishing pattern.', action: 'Do not click. Use the official app/website directly.', weight: 24 },
]

function sevLabel(w: number): Signal['severity_label'] {
  return w >= 30 ? 'critical' : w >= 20 ? 'high' : w >= 12 ? 'medium' : 'low'
}

export function extractUrls(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of text.matchAll(URL_RE)) {
    const u = m[0].replace(/[).,;"']+$/, '')
    if (!seen.has(u.toLowerCase())) { seen.add(u.toLowerCase()); out.push(u) }
  }
  return out.slice(0, 10)
}

export function analyzeUrlLocal(raw: string): UrlCheckResponse {
  const url = raw.trim()
  const normalized = /^https?:\/\//i.test(url) ? url : `http://${url}`
  const findings: UrlFinding[] = []
  let score = 0
  let host = ''
  let scheme = 'http'
  try { const p = new URL(normalized); host = p.hostname.toLowerCase(); scheme = p.protocol.replace(':', '') } catch { /* malformed */ }

  if (!host || !host.includes('.')) { findings.push({ rule_id: 'URL_MALFORMED', title: 'Invalid hostname', detail: `'${host || url}' is not a valid web hostname.`, severity: 'high' }); score += 40 }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) { findings.push({ rule_id: 'URL_IP_HOST', title: 'IP address instead of domain', detail: 'Legitimate brands essentially never send raw-IP links.', severity: 'high' }); score += 35 }
  if (SHORTENERS.has(host) || [...SHORTENERS].some((s) => host.endsWith('.' + s))) { findings.push({ rule_id: 'URL_SHORTENER', title: 'URL shortener hides destination', detail: `'${host}' is a shortening service — the real destination is hidden.`, severity: 'medium' }); score += 22 }
  if (host.startsWith('xn--') || host.includes('.xn--')) { findings.push({ rule_id: 'URL_PUNYCODE', title: 'Punycode (lookalike-character) domain', detail: 'Can visually imitate real brand names with foreign characters.', severity: 'high' }); score += 30 }
  if (normalized.split('://')[1]?.includes('@')) { findings.push({ rule_id: 'URL_AT_SYMBOL', title: "'@' symbol in URL", detail: 'Everything before @ is ignored by browsers — fakes the visible domain.', severity: 'high' }); score += 28 }
  const labels = host.split('.')
  if (labels.length >= 4) { findings.push({ rule_id: 'URL_DECEPTIVE_SUBDOMAIN', title: 'Many subdomains (possible spoofing)', detail: `'${host}' hides the real domain at the end.`, severity: 'medium' }); score += 20 }
  const registrable = labels.length >= 2 ? labels[labels.length - 2] : host
  const brandHit = BRANDS.find((b) => host.replace(/-/g, '').includes(b) && registrable !== b)
  if (brandHit) { findings.push({ rule_id: 'URL_BRAND_LOOKALIKE', title: `Brand '${brandHit}' in a different domain`, detail: `Real domain is '${registrable}', not '${brandHit}'.`, severity: 'high' }); score += 32 }
  if (SUS_TLDS.some((t) => host.endsWith(t))) { findings.push({ rule_id: 'URL_SUSPICIOUS_TLD', title: 'Low-reputation TLD', detail: 'Cheap TLDs are disproportionately used in phishing (not proof alone).', severity: 'low' }); score += 10 }
  if (normalized.length > 110) { findings.push({ rule_id: 'URL_VERY_LONG', title: 'Unusually long URL', detail: `${normalized.length} characters — can bury the real destination.`, severity: 'low' }); score += 8 }
  if (scheme === 'http') { findings.push({ rule_id: 'URL_NO_HTTPS', title: 'Not using HTTPS', detail: 'Login/payment pages always use https://.', severity: 'low' }); score += 8 }
  score = Math.min(score, 100)
  const level = score >= 55 ? 'high' : score >= 28 ? 'medium' : 'low'
  return {
    url, normalized_url: normalized, risk_index: score, risk_level: level, findings,
    summary: findings.length === 0 ? 'No deceptive URL patterns found. This does NOT verify the site is safe — domain reputation was not checked.' : `This URL shows ${findings.length} suspicious pattern(s). Avoid visiting it from an unsolicited message.`,
    disclaimer: 'Pattern-based inspection only (on-device fallback). The URL was never visited; no reputation database was queried.',
    processing_ms: 1, engine_source: 'on-device fallback (backend unreachable)',
  }
}

export function analyzeTextLocal(text: string, language = 'auto'): AnalyzeResponse {
  const clean = text.trim()
  const signals: Signal[] = []
  const fired = new Set<string>()
  const NEGATION = /\b(do not|don't|dont|never|not)\s+(share|disclose|tell|reveal)/i
  const GUARDED = new Set(['OTP_REQUEST', 'PIN_PASSWORD_REQUEST'])
  for (const r of RULES) {
    const m = clean.match(r.re)
    if (m && GUARDED.has(r.id)) {
      const win = clean.slice(Math.max(0, (m.index ?? 0) - 25), (m.index ?? 0) + m[0].length + 25)
      if (NEGATION.test(win)) continue
    }
    if (m && !fired.has(r.id)) {
      fired.add(r.id)
      const start = Math.max(0, (m.index ?? 0) - 4)
      const excerpt = clean.slice(start, (m.index ?? 0) + m[0].length + 4).trim()
      signals.push({ rule_id: r.id, category: r.category, excerpt: excerpt.length < clean.length ? `…${excerpt}…` : excerpt, explanation: r.explanation, severity: r.weight, severity_label: sevLabel(r.weight), recommended_action: r.action })
    }
  }
  const urls = extractUrls(clean)
  const urlFindings: UrlFinding[] = []
  let urlScore = 0
  for (const u of urls) { const r = analyzeUrlLocal(u); urlFindings.push(...r.findings); urlScore = Math.max(urlScore, r.risk_index) }
  if (urls.length && urlFindings.length) {
    const w = Math.min(30, Math.max(12, Math.floor(urlScore / 2)))
    signals.push({ rule_id: 'SUSPICIOUS_URL', category: 'Phishing Link', excerpt: urls[0].slice(0, 110), explanation: 'A link shows suspicious patterns: ' + urlFindings.slice(0, 3).map((f) => f.title).join('; ') + '.', severity: w, severity_label: sevLabel(w), recommended_action: 'Do not tap the link. Use the official site/app directly.' })
  } else if (urls.length) {
    signals.push({ rule_id: 'URL_PRESENT', category: 'Link Present', excerpt: urls[0].slice(0, 110), explanation: 'Message contains a link with no strong deceptive patterns; unexpected links still deserve caution.', severity: 6, severity_label: 'low', recommended_action: 'Preview the destination before tapping; prefer the official app.' })
  }
  const weights = signals.filter((s) => s.rule_id !== 'URL_PRESENT').map((s) => s.severity).sort((a, b) => b - a)
  const base = weights.reduce((a, w, i) => a + w * (i === 0 ? 1 : i === 1 ? 0.6 : i === 2 ? 0.4 : 0.25), 0)
  const distinct = new Set(signals.filter((s) => s.rule_id !== 'URL_PRESENT').map((s) => s.rule_id)).size
  let risk = Math.min(100, Math.round(base + (fired.has('OTP_REQUEST') && (fired.has('ACCOUNT_THREAT') || fired.has('URGENCY')) ? 10 : 0) + (distinct >= 3 ? 8 : 0)))
  if (risk === 0 && urls.length) risk = 12
  const level = risk >= 55 ? 'high' : risk >= 28 ? 'medium' : 'low'
  const PRIORITY: [string, string][] = [['OTP_REQUEST', 'OTP / Credential Theft'], ['PIN_PASSWORD_REQUEST', 'OTP / Credential Theft'], ['REMOTE_ACCESS', 'Remote-Access Scam'], ['AUTHORITY_THREAT', 'Impersonation / Digital-Arrest Scam'], ['FAKE_KYC', 'Fake KYC Alert'], ['ACCOUNT_THREAT', 'Bank Impersonation'], ['ADVANCE_FEE_JOB', 'Fake Job Offer'], ['PRIZE_SCAM', 'Prize / Lottery Scam'], ['INVESTMENT_SCAM', 'Investment Scam'], ['PAYMENT_DEMAND', 'Payment / UPI Fraud'], ['GENERIC_PHISHING_LINK', 'Phishing']]
  const suspected = PRIORITY.find(([id]) => fired.has(id))?.[1] ?? 'No strong scam category detected'
  const actions = level === 'low'
    ? ['No urgent action needed based on this scan.', 'Still verify unexpected requests (money, codes, links) through official channels.']
    : [...(level === 'high' ? ['Stop and do not reply, pay, or click anything in this message.'] : []), ...signals.slice().sort((a, b) => b.severity - a.severity).map((s) => s.recommended_action)]
  return {
    risk_index: risk, risk_level: level, suspected_category: suspected,
    summary: level === 'high' ? `This message shows ${distinct} strong warning signal(s) consistent with ${suspected.toLowerCase()}. Do not share codes, pay, or tap links until you verify independently.` : level === 'medium' ? `This message shows some warning signs (${distinct} signal(s)). Treat it with caution and verify via official channels.` : 'No strong scam indicators were detected. It reads like a routine message — but a low score can never guarantee that a message is genuine.',
    signals, highlighted_phrases: signals.map((s) => s.excerpt.replace(/…/g, '').trim()).filter(Boolean).slice(0, 12),
    url_findings: urlFindings, recommended_actions: [...new Set(actions)].slice(0, 6),
    uncertainty_statement: 'This risk index is an experimental, rule-based indicator — not a validated probability of fraud. A low score does not guarantee legitimacy; a high score is not proof of fraud. Always verify via official channels when money or credentials are involved.',
    extracted_urls: urls, language_detected: language === 'auto' ? (/[\u0A80-\u0AFF]/.test(clean) ? 'gu' : /[\u0900-\u097F]/.test(clean) ? 'hi' : 'en') : language,
    word_count: clean.split(/\s+/).filter(Boolean).length, processing_ms: 1, engine_version: '1.0.0-rule-based (TS mirror)', engine_source: 'on-device fallback (backend unreachable)',
  }
}
