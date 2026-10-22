# ScamShield AI — Digital Scam Protector

**“Detect the Scam. Protect Your Money. Stay Safe Online.”**

An explainable, privacy-first web app that helps people identify suspicious SMS / WhatsApp / email messages, screenshots and links **before** they lose money — and explains exactly *which phrases* are dangerous and *what to do next*.

**Core workflow: SCAN → DETECT → EXPLAIN → PROTECT**

> The risk index is an *experimental, rule-based indicator* — not a validated probability of fraud. A low score never guarantees a message is genuine; a high score is not proof of fraud. ScamShield never asks for your OTP, PIN, or password.

---

## What's inside

| Area | What it does |
|---|---|
| **Landing page** | Hero (“One Click Can Change Everything. Check Before You Trust.”), scanner preview, features, scam categories, privacy commitments, FAQs, official safety resources |
| **Scam Scanner** | Paste text, inspect a URL, or upload a screenshot (OCR). Language selection (English / Hindi / Hinglish / Gujarati), 5 fictional demo scenarios, loading/error/empty states |
| **Explainable results** | 0–100 risk index, LOW/MEDIUM/HIGH warning, suspected category, highlighted evidence phrases, per-rule explanations, URL findings, recommended actions, uncertainty statement, exportable redacted report |
| **Security Dashboard** | Your real scan stats (synthetic demo data until your first scan, clearly labelled), Recharts visualizations, recent scans, top signals, learning progress |
| **URL Checker** | IP hosts, shorteners, lookalike brands, deceptive subdomains, punycode, `@` tricks, suspicious TLDs, long/encoded URLs. Links are **never opened** |
| **Safety Assistant** | Multilingual rule-based assistant (works with no API key) + checklists and suggested questions |
| **Emergency Center** | Guided checklists for 6 incident types; India helpline **1930** and cybercrime.gov.in |
| **Family Protection** | Preview + explicit confirmation + auto-redacted copy/download reports (nothing is auto-sent) |
| **Scam Intelligence** | Category / language / trend charts over clearly-labelled synthetic demo data (switches to your real categories after a few scans) |
| **Learning Center** | 6 fictional interactive quizzes with explanations, progress tracking, restart/retry |
| **History & Settings** | Searchable local history, risk filters, per-report view, export/delete, theme (dark/light), language, retention controls |

## Tech stack

- **Frontend:** React + Vite + TypeScript, Tailwind CSS v4, Framer Motion, Recharts, Lucide icons, React Router, Tesseract.js (on-device OCR)
- **Backend:** Python + FastAPI, Pydantic schemas, modular rule-based detection engine, optional server OCR (pytesseract), in-memory rate limiting
- **Tests:** Vitest + React Testing Library (7 tests), Pytest (10 tests incl. the 3 required demo scenarios)
- **Optional (graceful fallback when unset):** OpenAI-style LLM explanations, Supabase Auth/Postgres for accounts — see `.env.example`

## Quick start

### 1. Backend (FastAPI — port 8000)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# API docs: http://localhost:8000/docs   Health: http://localhost:8000/api/health
```

Optional server-side OCR: install the `tesseract` system binary (e.g. `sudo apt install tesseract-ocr tesseract-ocr-hin tesseract-ocr-guj`). Without it, `POST /api/analyze/image` honestly returns `503` and the web app automatically uses **on-device OCR** (screenshots never leave the browser).

### 2. Frontend (Vite — port 5173)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev        # http://localhost:5173  (proxies /api → 127.0.0.1:8000)
```

If the backend is unreachable, the scanner still works via a clearly-labelled **on-device fallback engine** (a TypeScript mirror of the same rules) — results state their source, never faked.

## API reference (examples)

### `POST /api/analyze/text`

```bash
curl -X POST localhost:8000/api/analyze/text -H 'Content-Type: application/json' -d '{
  "text": "Dear customer, your account will be blocked within 2 hours. Share the OTP to verify your KYC.",
  "language": "auto"
}'
```

Response (abridged):

```json
{
  "risk_index": 87,
  "risk_level": "high",
  "suspected_category": "OTP / Credential Theft",
  "summary": "This message shows 4 strong warning signal(s) consistent with otp / credential theft…",
  "signals": [{
    "rule_id": "OTP_REQUEST", "category": "OTP / Credential Theft",
    "excerpt": "…share the OTP to verify…",
    "explanation": "The message asks you to share an OTP. Banks never ask…",
    "severity": 35, "severity_label": "critical",
    "recommended_action": "Never share the OTP…"
  }],
  "recommended_actions": ["Stop and do not reply, pay, or click…"],
  "uncertainty_statement": "This risk index is an experimental, rule-based indicator…"
}
```

### Other endpoints

- `POST /api/analyze/url` — `{ "url": "http://sbi-kyc-verify.xyz/login" }` → pattern findings + risk index (never fetches the URL)
- `POST /api/analyze/image` — multipart screenshot (PNG/JPEG/WEBP/BMP, ≤5 MB) → OCR text + analysis, or an honest error
- `POST /api/assistant` — `{ "message": "Someone asked for my OTP", "language": "hinglish" }` → reply + checklist
- `GET /api/health` — engine status + server-OCR availability

*History note:* in guest mode history lives in browser local storage by design (see Privacy). The `GET/DELETE /api/history…` pattern is reserved for the optional Supabase-backed account mode, where server-side authorization scopes every report to its owner.

## Detection engine design

- **Contextual rules, not keyword guilt:** every rule needs paired evidence (e.g. OTP + a *share/send* verb; job context + an *advance-fee* request). A genuine “Your OTP is 123456, do not share it” message is **not** flagged high — covered by a regression test.
- **14 rule families:** OTP/PIN theft, account threats, fake KYC, bank impersonation, prize, advance-fee jobs, too-good jobs, UPI/QR payment traps, remote-access apps, guaranteed-return investments, urgency, authority/digital-arrest threats, fake support, phishing CTAs, secrecy pressure + URL pattern analysis.
- **Multilingual:** English, Hindi (Devanagari), Hinglish (roman Hindi) and Gujarati trigger phrases.
- **Scoring:** the strongest signal anchors the score at full weight; additional signals add diminishing weight (60% / 40% / 25%), plus combination bonuses (e.g. OTP request × urgency), capped at 100. Bands: LOW < 28, MEDIUM 28–54, HIGH ≥ 55. A single strong lure (e.g. a lottery claim) therefore lands in MEDIUM, while a keyword with no scam context fires nothing at all.

## The 3 required demo scenarios (all fictional, verified by automated tests)

1. **Fake banking alert** — OTP request + block threat + KYC + phishing link → **HIGH**, phrases highlighted. ✅
2. **Fake job offer** — advance registration fee → **MEDIUM–HIGH** with “verify the employer” guidance (never asserts fraud as fact). ✅
3. **Normal appointment reminder** → **LOW** with an explicit “not a guarantee” statement. ✅

## Testing

```bash
cd backend && python -m pytest tests/ -q     # 10 tests: scenarios, Hinglish, URL rules, API validation, OCR errors, assistant
cd frontend && npm test                       # 7 tests: landing CTAs, fallback engine, redaction, XSS-safe highlighting
cd frontend && npm run build                  # type-check + production build
```

No accuracy/precision figures are claimed: the rule set has not been evaluated on a labelled production corpus, and the UI says so.

## Security & privacy

- Secrets live only in server environment variables; none in frontend code.
- Uploads: type/size validated, processed in memory, never executed, not stored by default.
- Submitted URLs are never visited; rendered messages are plain React text (XSS-safe, covered by a test).
- Shared/exported reports auto-redact phone numbers, emails, UPI IDs, card-like numbers and codes.
- Rate limiting (60 req/min/IP) on the API; CORS restricted in production via your reverse proxy.

## Deployment

- **Frontend → Vercel/Netlify:** `cd frontend && npm run build` (output `dist/`). Set `VITE_API_BASE` to your API origin, or proxy `/api` to it.
- **Backend → Render/Railway/Fly/your VM:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT` with `backend/requirements.txt`. Add the `tesseract` apt package only if you want server OCR.

## Project structure

```
scamshield-ai/
├── frontend/                 # React + Vite + TS
│   └── src/
│       ├── components/       # Layout, RiskGauge, ResultsView…
│       ├── pages/            # Landing, Scanner, Dashboard, Assistant, Emergency, Learn, Intel, Family, History, Settings
│       ├── services/         # api.ts (backend client + fallback), localEngine.ts (on-device rules)
│       ├── lib/store.ts      # local history/settings, redaction, report builder
│       └── data/demo.ts      # fictional scenarios, quiz, synthetic intel data
├── backend/
│   └── app/
│       ├── main.py           # FastAPI routes, rate limiting, OCR endpoint
│       ├── detection/engine.py  # explainable rule engine + URL inspector
│       ├── services/assistant.py # multilingual rule-based assistant
│       └── schemas/          # Pydantic request/response models
│   └── tests/test_engine.py
├── .env.example
└── README.md
```

## Limitations (honest list)

- Rule-based pattern matching only — no sender authentication, no live domain-reputation feed, no ML model is claimed.
- OCR quality depends on screenshot clarity; failures are reported, never faked.
- Audio analysis is **not** implemented (no genuine speech-to-text in this build), so it is not offered.
- Guest history is per-browser; account sync requires configuring Supabase (see `.env.example`).

---

*ScamShield AI is an education/safety aid, not a law-enforcement or banking service. If money was lost in India: call **1930** immediately and report at <https://cybercrime.gov.in/>.*
