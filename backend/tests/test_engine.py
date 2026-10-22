"""Tests for the three required demo scenarios + URL checker + API validation."""
from fastapi.testclient import TestClient

from app.detection.engine import analyze_text, analyze_url
from app.main import app

client = TestClient(app)

BANK_SCAM = ("Dear customer, your SBI account will be blocked within 2 hours. "
             "Update your KYC immediately and share the OTP sent to your phone to verify. "
             "Click here to verify: http://sbi-kyc-verify.xyz/login")
JOB_SCAM = ("Congratulations! You are selected for a work from home job. Salary Rs 45000 per month. "
            "To confirm your offer letter, pay a registration fee of Rs 1499 via UPI today.")
NORMAL = ("Hello, this is a reminder from CityCare Clinic. Your appointment with Dr. Patel Mehta "
          "is tomorrow at 10:30 AM. Please arrive 10 minutes early and bring your previous reports.")


def test_scenario1_fake_bank_high_risk_with_otp_signal():
    r = analyze_text(BANK_SCAM)
    assert r["risk_level"] == "high"
    ids = {s.rule_id for s in r["signals"]}
    assert "OTP_REQUEST" in ids
    assert r["extracted_urls"], "URL must be extracted"
    assert r["recommended_actions"]


def test_scenario2_fake_job_advance_fee():
    r = analyze_text(JOB_SCAM)
    assert r["risk_level"] in ("medium", "high")
    ids = {s.rule_id for s in r["signals"]}
    assert "ADVANCE_FEE_JOB" in ids


def test_scenario3_normal_reminder_low_risk():
    r = analyze_text(NORMAL)
    assert r["risk_level"] == "low"
    assert r["risk_index"] < 28
    assert "does not guarantee" in r["uncertainty_statement"] or "not guarantee" in r["summary"] or "never guarantee" in r["summary"]


def test_single_keyword_not_high_risk():
    r = analyze_text("Your OTP for login is 482910. Do not share it with anyone. - Team ExampleBank")
    # A genuine OTP-delivery message ("do not share") must stay LOW risk.
    assert r["risk_level"] == "low"
    assert "OTP_REQUEST" not in {s.rule_id for s in r["signals"]}


def test_hinglish_otp_scam():
    r = analyze_text("Aapka account band ho jayega, turant OTP batao warna card block ho jayega")
    ids = {s.rule_id for s in r["signals"]}
    assert "OTP_REQUEST" in ids
    assert r["risk_level"] in ("medium", "high")


def test_url_ip_and_brand_lookalike():
    score, findings, _ = analyze_url("http://192.168.10.5/sbi-login")
    assert any(f.rule_id == "URL_IP_HOST" for f in findings)
    assert score >= 30
    score2, findings2, _ = analyze_url("https://sbi.secure-verify.xyz/login")
    assert any(f.rule_id in ("URL_BRAND_LOOKALIKE", "URL_DECEPTIVE_SUBDOMAIN") for f in findings2)


def test_malformed_url():
    score, findings, _ = analyze_url("not a url at all !!!")
    assert findings  # some finding must be reported, no crash


def test_api_validation_and_health():
    assert client.get("/api/health").status_code == 200
    assert client.post("/api/analyze/text", json={"text": "hi"}).status_code == 422  # too short
    ok = client.post("/api/analyze/text", json={"text": BANK_SCAM})
    assert ok.status_code == 200
    body = ok.json()
    assert 0 <= body["risk_index"] <= 100
    assert body["signals"]


def test_api_image_unsupported_type():
    resp = client.post("/api/analyze/image", files={"file": ("x.txt", b"hello", "text/plain")})
    assert resp.status_code == 415


def test_assistant_otp_guidance():
    resp = client.post("/api/assistant", json={"message": "Someone asked for my OTP", "language": "en"})
    assert resp.status_code == 200
    assert "Never share" in resp.json()["reply"]
