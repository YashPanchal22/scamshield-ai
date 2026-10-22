export type RiskLevel = 'low' | 'medium' | 'high'
export type Language = 'auto' | 'en' | 'hi' | 'hinglish' | 'gu'

export interface Signal {
  rule_id: string
  category: string
  excerpt: string
  explanation: string
  severity: number
  severity_label: 'low' | 'medium' | 'high' | 'critical'
  recommended_action: string
}

export interface UrlFinding {
  rule_id: string
  title: string
  detail: string
  severity: string
}

export interface AnalyzeResponse {
  risk_index: number
  risk_level: RiskLevel
  suspected_category: string
  summary: string
  signals: Signal[]
  highlighted_phrases: string[]
  url_findings: UrlFinding[]
  recommended_actions: string[]
  uncertainty_statement: string
  extracted_urls: string[]
  language_detected: string
  word_count: number
  processing_ms: number
  engine_version: string
  extracted_text?: string
  ocr_engine?: string
  engine_source?: string
}

export interface UrlCheckResponse {
  url: string
  normalized_url: string
  risk_index: number
  risk_level: RiskLevel
  findings: UrlFinding[]
  summary: string
  disclaimer: string
  processing_ms: number
  engine_source?: string
}

export interface AssistantResponse {
  reply: string
  checklist: string[]
  suggested_questions: string[]
  source: string
}

export interface ScanRecord {
  id: string
  created_at: string
  input: string
  input_type: 'text' | 'url' | 'screenshot'
  language: string
  result: AnalyzeResponse
}
