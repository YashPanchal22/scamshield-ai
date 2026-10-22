from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class SignalSchema(BaseModel):
    rule_id: str
    category: str
    excerpt: str
    explanation: str
    severity: int  # weight 0-40
    severity_label: str  # low / medium / high / critical
    recommended_action: str


class UrlFinding(BaseModel):
    rule_id: str
    title: str
    detail: str
    severity: str


class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=8000)
    language: str = Field(default="auto", description="en | hi | hinglish | gu | auto")
    source: str = Field(default="text", description="text | sms | whatsapp | email | screenshot")


class AnalyzeUrlRequest(BaseModel):
    url: str = Field(..., min_length=4, max_length=2048)


class AnalyzeResponse(BaseModel):
    risk_index: int
    risk_level: RiskLevel
    suspected_category: str
    summary: str
    signals: List[SignalSchema]
    highlighted_phrases: List[str]
    url_findings: List[UrlFinding]
    recommended_actions: List[str]
    uncertainty_statement: str
    extracted_urls: List[str]
    language_detected: str
    word_count: int
    processing_ms: int
    engine_version: str = "1.0.0-rule-based"


class UrlCheckResponse(BaseModel):
    url: str
    normalized_url: str
    risk_index: int
    risk_level: RiskLevel
    findings: List[UrlFinding]
    summary: str
    disclaimer: str
    processing_ms: int


class AssistantRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    language: str = Field(default="en")
    context_category: Optional[str] = None


class AssistantResponse(BaseModel):
    reply: str
    checklist: List[str]
    suggested_questions: List[str]
    source: str = "rule-based-fallback (no LLM key configured)"


class HealthResponse(BaseModel):
    status: str
    engine: str
    ocr_available: bool
    version: str
