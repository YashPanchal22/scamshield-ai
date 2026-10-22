"""ScamShield AI — FastAPI backend.

Privacy notes:
- Submitted text is analysed in-memory and NOT persisted by default.
- Uploaded screenshots are processed in-memory and never written to disk.
- Submitted URLs are never fetched/visited — only pattern-inspected.
"""
from __future__ import annotations

import io
import time
from collections import defaultdict

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.detection.engine import analyze_text, analyze_url
from app.schemas.schemas import (
    AnalyzeResponse, AnalyzeTextRequest, AnalyzeUrlRequest, AssistantRequest,
    AssistantResponse, HealthResponse, UrlCheckResponse,
)
from app.services.assistant import assistant_reply

app = FastAPI(title="ScamShield AI API", version="1.0.0",
              description="Explainable, rule-based scam detection. Risk index is an experimental indicator, not a probability of fraud.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- simple in-memory rate limit: 60 req / minute / IP ---
_hits: dict[str, list[float]] = defaultdict(list)


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    _hits[ip] = [t for t in _hits[ip] if now - t < 60]
    if len(_hits[ip]) > 60:
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Please wait a minute and retry."})
    _hits[ip].append(now)
    return await call_next(request)


def _ocr_available() -> bool:
    try:
        import shutil
        return shutil.which("tesseract") is not None
    except Exception:
        return False


@app.get("/api/health", response_model=HealthResponse)
def health():
    return {"status": "ok", "engine": "rule-based-v1", "ocr_available": _ocr_available(), "version": "1.0.0"}


@app.post("/api/analyze/text", response_model=AnalyzeResponse)
def analyze_text_endpoint(req: AnalyzeTextRequest):
    start = time.time()
    result = analyze_text(req.text, req.language)
    result["processing_ms"] = int((time.time() - start) * 1000)
    return result


@app.post("/api/analyze/url", response_model=UrlCheckResponse)
def analyze_url_endpoint(req: AnalyzeUrlRequest):
    start = time.time()
    score, findings, normalized = analyze_url(req.url)
    level = "high" if score >= 55 else ("medium" if score >= 28 else "low")
    if not findings:
        summary = "No deceptive URL patterns were found. This does NOT verify the site is safe — domain reputation was not checked (no external service configured)."
    elif level == "high":
        summary = f"This URL shows {len(findings)} suspicious pattern(s) and should not be visited from an unsolicited message."
    else:
        summary = f"This URL shows {len(findings)} pattern(s) worth caution. Prefer navigating via the official app/website."
    return {
        "url": req.url, "normalized_url": normalized, "risk_index": score, "risk_level": level,
        "findings": findings, "summary": summary,
        "disclaimer": "Pattern-based inspection only. The URL was never visited, and no domain-reputation database was queried.",
        "processing_ms": int((time.time() - start) * 1000),
    }


ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


@app.post("/api/analyze/image")
async def analyze_image_endpoint(file: UploadFile = File(...), language: str = "auto"):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415,
                            detail=f"Unsupported file type '{file.content_type}'. Please upload a PNG, JPEG, WEBP or BMP screenshot.")
    data = await file.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 5 MB). Please upload a smaller screenshot.")
    if not data:
        raise HTTPException(status_code=400, detail="Empty file received.")

    if not _ocr_available():
        # Honest fallback — do NOT pretend OCR ran.
        raise HTTPException(
            status_code=503,
            detail=("Server-side OCR is unavailable (tesseract binary not installed on this host). "
                    "The web app will automatically fall back to on-device OCR (Tesseract.js) in your browser — "
                    "your screenshot never leaves your device in that mode."),
        )
    try:
        import pytesseract  # type: ignore
        from PIL import Image
        image = Image.open(io.BytesIO(data))
        lang_map = {"hi": "eng+hin", "gu": "eng+guj"}
        text = pytesseract.image_to_string(image, lang=lang_map.get(language, "eng"))
    except Exception as exc:  # OCR genuinely failed
        raise HTTPException(status_code=422, detail=f"OCR failed to extract text from this image: {exc}") from exc

    if not text or len(text.strip()) < 3:
        raise HTTPException(status_code=422,
                            detail="No readable text could be extracted from this screenshot. Try a clearer image, or paste the message text instead.")
    start = time.time()
    result = analyze_text(text.strip(), language)
    result["processing_ms"] = int((time.time() - start) * 1000)
    return {**result, "extracted_text": text.strip()[:4000], "ocr_engine": "pytesseract (server)"}


@app.post("/api/assistant", response_model=AssistantResponse)
def assistant_endpoint(req: AssistantRequest):
    return assistant_reply(req.message, req.language)


@app.get("/")
def root():
    return {"service": "ScamShield AI API", "docs": "/docs", "health": "/api/health"}
