"""ScamShield AI — Explainable rule-based detection engine.

Design principles:
- Every signal is traceable to an exact excerpt of user input.
- No single bare keyword fires a high-severity signal; patterns require context
  (e.g. OTP + a share/enter verb, bank + threat/action).
- The risk index is an experimental indicator, NOT a validated probability.
- Multilingual pattern coverage: English, Hindi (Devanagari + Hinglish), Gujarati.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List
from urllib.parse import urlparse

from app.schemas.schemas import SignalSchema, UrlFinding

# ---------------------------------------------------------------- helpers

URL_RE = re.compile(
    r"\b(?:https?://|www\.)[^\s<>\"]+|\b[a-zA-Z0-9-]+\.(?:com|in|net|org|io|xyz|top|click|live|site|online|info|co|me|link|buzz|tk|ml|cf|ga|gq|ru|su|work|support|help|verify|secure)\b[^\s<>\"]*",
    re.IGNORECASE,
)

SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "rb.gy", "cutt.ly", "shorturl.at",
    "is.gd", "tiny.cc", "rebrand.ly", "short.io", "ow.ly", "buff.ly", "s.id",
}

BRANDS = {
    "sbi", "hdfc", "icici", "axis", "kotak", "pnb", "paytm", "phonepe", "gpay",
    "googlepay", "amazon", "flipkart", "paypal", "apple", "microsoft", "netflix",
    "instagram", "facebook", "whatsapp", "rbi", "uidai", "aadhaar", "npci", "upi",
}

SUSPICIOUS_TLDS = {".xyz", ".top", ".click", ".buzz", ".tk", ".ml", ".cf", ".ga", ".gq", ".work", ".live", ".site"}


def _find(pattern: str, text: str) -> list[re.Match]:
    return list(re.finditer(pattern, text, re.IGNORECASE | re.UNICODE))


def _sev_label(weight: int) -> str:
    if weight >= 30:
        return "critical"
    if weight >= 20:
        return "high"
    if weight >= 12:
        return "medium"
    return "low"


@dataclass
class _Hit:
    rule_id: str
    category: str
    pattern: str
    explanation: str
    action: str
    weight: int


# ---------------------------------------------------------------- rules
# Each rule needs contextual pairing — never a lone keyword at high severity.

RULES: list[_Hit] = [
    _Hit(
        "OTP_REQUEST", "OTP / Credential Theft",
        r"\b(otp|one[\s-]?time password|verification code|ओटीपी|ઓટીપી)\b.{0,40}\b(share|send|batao|बताओ|बताइए|enter|submit|provide|bhejo|भेजो|do|दो|આપો|મોકલો)\b|\b(share|send|batao|बताओ|enter|bhejo|भेजो)\b.{0,25}\b(otp|ओटीपी|ઓટીપી)\b",
        "The message asks you to share an OTP. Banks and legitimate services never ask for OTPs over calls, SMS, or chats.",
        "Never share the OTP. End the conversation and contact your bank via its official app/number.",
        35,
    ),
    _Hit(
        "PIN_PASSWORD_REQUEST", "OTP / Credential Theft",
        r"\b(share|send|enter|provide|batao|बताओ)\b.{0,30}\b(pin|password|cvv|atm pin|upi pin|पासवर्ड|પિન|પાસવર્ડ)\b|\b(your|apna|अपना|તમારો)\b.{0,15}\b(pin|password|cvv)\b.{0,20}\b(share|send|enter|batao)\b",
        "The message requests a PIN, password, or CVV. No legitimate organisation asks for these secrets.",
        "Do not share any PIN/password/CVV with anyone. Change it from a trusted device if already shared.",
        35,
    ),
    _Hit(
        "ACCOUNT_THREAT", "Bank Impersonation",
        r"\b(account|card|खाता|ખાતું|ekyc|kyc|sim|number)\b.{0,40}\b(block|blocked|suspend|suspended|freeze|frozen|deactivat|band|बंद|બંધ|close|closed|hold)\b|\b(block|बंद|બંધ) (ho jayega|kar diya|हो जाएगा|થઈ જશે)\b",
        "Threats of immediate account/card blocking are a classic pressure tactic to stop you thinking and verifying.",
        "Do not act on the message. Open your official bank app or visit a branch to check account status.",
        28,
    ),
    _Hit(
        "FAKE_KYC", "Fake KYC Alert",
        r"\b(kyc|e-?kyc|केवाईसी)\b.{0,40}\b(update|verify|pending|expire|expiry|complete|required|submit|अपडेट|અપડેટ)\b|\b(update|verify)\b.{0,20}\b(kyc|केवाईसी)\b",
        "Fake KYC-update alerts are widely used to steal banking credentials through lookalike forms.",
        "Banks do not send KYC links via SMS/WhatsApp. Update KYC only inside the official app or at a branch.",
        26,
    ),
    _Hit(
        "BANK_IMPERSONATION", "Bank Impersonation",
        r"\b(dear (customer|user)|प्रिय ग्राहक|પ્રિય ગ્રાહક)\b.{0,80}\b(bank|बैंक|બેંક|account|card|rbi|sbi|hdfc|icici)\b|\b(rbi|reserve bank|bank (officer|manager|alert))\b.{0,50}\b(verify|blocked|urgent|immediately|तुरंत|તરત)\b",
        "The message imitates an official bank/regulator tone ('Dear customer…') combined with an urgent banking action.",
        "Verify through the number printed on the back of your card — never a number given in the message.",
        22,
    ),
    _Hit(
        "PRIZE_SCAM", "Prize / Lottery Scam",
        r"\b(you (have )?won|winner|lottery|prize|lucky draw|ઈનામ|લોટરી|जीत[ेआ]|જીત્યા)\b.{0,60}(₹|\$|rs\.?|rupees|lakh|crore|iphone|gift|claim)|"
        r"\bcongratulations\b.{0,50}\b(won|winner|prize|lottery|lucky draw)\b|"
        r"(₹|\$)\s?[\d,]{4,}.{0,30}\b(claim|won|prize|lottery)\b",
        "Unexpected prize/lottery claims that you never entered are a well-known lure; 'claiming' usually requires a fee or your bank details.",
        "Do not pay any fee or share details to claim a prize. Genuine lotteries never charge winners.",
        28,
    ),
    _Hit(
        "ADVANCE_FEE_JOB", "Fake Job Offer",
        r"\b(job|vacancy|hiring|recruit|नौकरी|નોકરી|offer letter|work from home)\b.{0,90}\b(registration fee|security deposit|advance|payment|processing fee|pay|fee|जमा|ફી|ડિપોઝિટ)\b|"
        r"\b(pay|deposit|जमा करो|જમા કરો)\b.{0,30}(₹|\$|rs\.?).{0,50}\b(job|training|registration|uniform|laptop)\b",
        "Legitimate employers do not ask candidates to pay registration/security fees before joining.",
        "Verify the employer on its official website/careers page. Never pay to get a job.",
        30,
    ),
    _Hit(
        "JOB_TOO_GOOD", "Fake Job Offer",
        r"\b(earn|salary|कमाओ|કમાઓ)\b.{0,25}(₹|\$|rs\.?)\s?[\d,]{4,}.{0,30}\b(per day|daily|per hour|घर बैठे|ઘેર બેઠા|no experience|part.?time)\b|"
        r"\b(part.?time job|telegram task|like (and|&) (earn|subscribe)|youtube like)\b.{0,40}(earn|₹|income)",
        "Very high pay for trivial/no-experience tasks (likes, ratings) is a hallmark of task-based job scams.",
        "Be sceptical of unsolicited high-pay offers on WhatsApp/Telegram; verify independently.",
        24,
    ),
    _Hit(
        "PAYMENT_DEMAND", "Payment Fraud",
        r"\b(pay|transfer|send|भेजो|मोकलो|મોકલો|bhej do|transfer karo)\b.{0,30}(₹|\$|rs\.?)\s?[\d,]+|\b(upi|qr code|क्यूआर)\b.{0,40}\b(scan|pay|send|स्कैन|સ્કેન)\b.{0,30}\b(receive|refund|प्राप्त|મેળવવા)\b",
        "The message pressures a payment or claims you must scan a QR / enter a PIN to *receive* money — receiving money never needs a PIN.",
        "Never enter your UPI PIN to receive money. Verify the payee independently before any transfer.",
        27,
    ),
    _Hit(
        "REMOTE_ACCESS", "Remote-Access Scam",
        r"\b(anydesk|teamviewer|quick ?support|rustdesk|screen ?share|remote access|ऐप (इंस्टॉल|डाउनलोड)|એપ (ઇન્સ્ટોલ|ડાઉનલોડ))\b|\b(install|download|इंस्टॉल|ડાઉનલોડ)\b.{0,30}\b(app|ऐप|એપ)\b.{0,40}\b(refund|support|help|verify|kyc)\b",
        "Requests to install screen-sharing/remote-access apps let scammers watch your OTPs and control your phone.",
        "Never install remote-access apps at a stranger's request. Uninstall immediately if installed and contact your bank.",
        34,
    ),
    _Hit(
        "INVESTMENT_SCAM", "Investment Scam",
        r"\b(guaranteed|double|triple|100%|गारंटी|ગેરંટી)\b.{0,40}\b(return|profit|money|रिटर्न|નફો|मुनाफा)\b|"
        r"\b(crypto|trading|stock tip|forex|investment)\b.{0,60}\b(double|guaranteed|per day profit|daily profit|[\d]+x return)\b",
        "Guaranteed or 'double your money' investment promises are illegal lures — genuine investments always carry risk.",
        "Check registration with SEBI/regulator. Never invest via unknown WhatsApp/Telegram groups.",
        28,
    ),
    _Hit(
        "URGENCY", "Urgency / Manipulation",
        r"\b(urgent|immediately|within \d+ (hours?|minutes?)|last warning|act now|तुरंत|अभी|ફટાફટ|તરત જ|forder|abhi karo|turant)\b|\b(only|केवल|માત્ર) \d+ (hour|hours|minute|minutes|घंटे|કલાક)\b.{0,20}\b(left|बाकी|બાકી)\b",
        "Artificial urgency is designed to make you act before you can verify. Legitimate institutions give reasonable time.",
        "Pause. Urgency itself is a reason to slow down and verify through official channels.",
        16,
    ),
    _Hit(
        "AUTHORITY_THREAT", "Impersonation / Intimidation",
        r"\b(police|cbi|customs|income tax|court|arrest|legal action|fir|पुलिस|ગિરફ્તાર|धमकी|કાનૂની)\b.{0,60}\b(pay|transfer|fine|arrest|case|कार्रवाई|કાર્યવાહી|immediately|तुरंत)\b|"
        r"\b(digital arrest|डिजिटल अरेस्ट|ડિજિટલ એરેસ્ટ)\b",
        "Threats of 'digital arrest'/legal action demanding payment are a known impersonation tactic — police never demand money on video calls.",
        "Disconnect. Verify with your local police station / cyber helpline 1930 (India).",
        30,
    ),
    _Hit(
        "IMPERSONATION_SUPPORT", "Impersonation",
        r"\b(customer (care|support|service)|helpdesk|support team|टेक सपोर्ट)\b.{0,60}\b(call|contact|whatsapp|number|कॉल|સંપર્ક)\b.{0,30}(\+?\d[\d\s-]{8,})|"
        r"\b(refund|रिफंड|રિફંડ)\b.{0,50}\b(call|contact|click|कॉल करो|કોલ કરો)\b",
        "Fake customer-care numbers in messages/search results route you to scammers instead of the real company.",
        "Use contact details only from the company's official website/app — never from unsolicited messages.",
        22,
    ),
    _Hit(
        "GENERIC_PHISHING_LINK", "Phishing Link",
        r"\b(click (here|the link)|यहाँ क्लिक|અહીં ક્લિક|link (par|पर) click|tap (here|the link))\b.{0,50}\b(verify|update|claim|login|unlock|केवाईसी|kyc)\b",
        "The message directs you to click a link to verify/claim/unlock — the standard phishing pattern.",
        "Do not click. Type the official website address yourself or use the official app.",
        24,
    ),
    _Hit(
        "SECRECY_PRESSURE", "Urgency / Manipulation",
        r"\b(do not (tell|share|discuss)|किसी को मत बताओ|કોઈને કહેશો નહીં|keep (this|it) secret|confidential)\b.{0,40}\b(family|bank|anyone|परिवार|પરિવાર)?\b",
        "Being told to keep the matter secret isolates you from people who could warn you — a manipulation red flag.",
        "Talk to a trusted family member before acting. Secrecy demands = danger sign.",
        18,
    ),
]


def extract_urls(text: str) -> list[str]:
    seen, out = set(), []
    for m in URL_RE.finditer(text or ""):
        u = m.group(0).rstrip(").,;\"'")
        if u.lower() not in seen:
            seen.add(u.lower())
            out.append(u)
    return out[:10]


def analyze_url(raw: str) -> tuple[int, list[UrlFinding], str]:
    """Pattern-based URL inspection. Never fetches the URL."""
    url = (raw or "").strip()
    normalized = url if re.match(r"https?://", url, re.I) else f"http://{url}"
    findings: list[UrlFinding] = []
    score = 0

    try:
        parsed = urlparse(normalized)
        host = (parsed.hostname or "").lower()
    except Exception:
        return 70, [UrlFinding(rule_id="URL_MALFORMED", title="Malformed URL",
                                detail="The URL could not be parsed into a valid web address.", severity="high")], normalized

    if not host or "." not in host:
        findings.append(UrlFinding(rule_id="URL_MALFORMED", title="Invalid hostname",
                                   detail=f"'{host or url}' is not a valid web hostname.", severity="high"))
        score += 40

    if re.fullmatch(r"\d{1,3}(?:\.\d{1,3}){3}", host):
        findings.append(UrlFinding(rule_id="URL_IP_HOST", title="IP address used instead of a domain name",
                                   detail="Legitimate banks/brands essentially never send links with a raw IP address.", severity="high"))
        score += 35

    if host in SHORTENERS or any(host.endswith("." + s) for s in SHORTENERS):
        findings.append(UrlFinding(rule_id="URL_SHORTENER", title="URL shortener hides the real destination",
                                   detail=f"'{host}' is a link-shortening service, so you cannot see where the link really goes.", severity="medium"))
        score += 22

    if host.startswith("xn--") or ".xn--" in host:
        findings.append(UrlFinding(rule_id="URL_PUNYCODE", title="Punycode (lookalike-character) domain",
                                   detail="Punycode domains can visually imitate real brand names using foreign characters.", severity="high"))
        score += 30

    if "@" in normalized.split("://", 1)[-1]:
        findings.append(UrlFinding(rule_id="URL_AT_SYMBOL", title="'@' symbol in URL",
                                   detail="Everything before '@' is ignored by browsers — a classic trick to fake the visible domain.", severity="high"))
        score += 28

    labels = host.split(".")
    if len(labels) >= 4:
        findings.append(UrlFinding(rule_id="URL_DECEPTIVE_SUBDOMAIN", title="Many subdomains (possible brand spoofing)",
                                   detail=f"'{host}' has {len(labels)} parts; scammers hide the real domain at the end, e.g. 'sbi.verify-login.xyz'.", severity="medium"))
        score += 20

    brand_hits = [b for b in BRANDS if b in host.replace("-", "")]
    registrable = labels[-2] if len(labels) >= 2 else host
    for b in brand_hits:
        if registrable != b:
            findings.append(UrlFinding(rule_id="URL_BRAND_LOOKALIKE", title=f"Brand name '{b}' embedded in a different domain",
                                       detail=f"The real domain is '{registrable}', not '{b}'. Official sites use the brand as the main domain (e.g. {b}.co.in / {b}.com).", severity="high"))
            score += 32
            break

    typo_checks = {"paypa1": "paypal", "g00gle": "google", "amaz0n": "amazon", "sb1": "sbi", "hdfc-bank-secure": "hdfc", "icici-secure": "icici", "netf1ix": "netflix", "app1e": "apple"}
    for typo, brand in typo_checks.items():
        if typo in host:
            findings.append(UrlFinding(rule_id="URL_TYPOSQUAT", title=f"Lookalike spelling of '{brand}'",
                                       detail=f"'{host}' closely imitates '{brand}' with altered characters.", severity="high"))
            score += 32
            break

    if any(host.endswith(t) for t in SUSPICIOUS_TLDS):
        findings.append(UrlFinding(rule_id="URL_SUSPICIOUS_TLD", title="Low-reputation top-level domain",
                                   detail="This ending (e.g. .xyz/.top/.click) is cheap to register and disproportionately used in phishing. This alone doesn't prove fraud.", severity="low"))
        score += 10

    if len(normalized) > 110:
        findings.append(UrlFinding(rule_id="URL_VERY_LONG", title="Unusually long URL",
                                   detail=f"The URL is {len(normalized)} characters long; long URLs are often used to bury the real destination.", severity="low"))
        score += 8

    if re.search(r"%[0-9a-fA-F]{2}", normalized) and normalized.count("%") >= 3:
        findings.append(UrlFinding(rule_id="URL_ENCODING", title="Heavy percent-encoding in URL",
                                   detail="Excessive %-encoding can hide the true destination or payload of a link.", severity="medium"))
        score += 14

    if parsed.scheme == "http":
        findings.append(UrlFinding(rule_id="URL_NO_HTTPS", title="Not using HTTPS",
                                   detail="The link uses plain http://, so traffic is unencrypted. Legitimate login/payment pages always use https://.", severity="low"))
        score += 8

    return min(score, 100), findings, normalized


_CATEGORY_PRIORITY = [
    ("OTP_REQUEST", "OTP / Credential Theft"),
    ("PIN_PASSWORD_REQUEST", "OTP / Credential Theft"),
    ("REMOTE_ACCESS", "Remote-Access Scam"),
    ("AUTHORITY_THREAT", "Impersonation / Digital-Arrest Scam"),
    ("FAKE_KYC", "Fake KYC Alert"),
    ("ACCOUNT_THREAT", "Bank Impersonation"),
    ("BANK_IMPERSONATION", "Bank Impersonation"),
    ("ADVANCE_FEE_JOB", "Fake Job Offer"),
    ("JOB_TOO_GOOD", "Fake Job Offer"),
    ("PRIZE_SCAM", "Prize / Lottery Scam"),
    ("INVESTMENT_SCAM", "Investment Scam"),
    ("PAYMENT_DEMAND", "Payment / UPI Fraud"),
    ("IMPERSONATION_SUPPORT", "Fake Customer-Support"),
    ("GENERIC_PHISHING_LINK", "Phishing"),
]


def detect_language(text: str) -> str:
    if re.search(r"[\u0A80-\u0AFF]", text):
        return "gu"
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"
    hinglish_markers = r"\b(ka|ki|hai|hoga|karo|bhejo|batao|turant|abhi|paise|aapka|ho jayega|mat)\b"
    if re.search(hinglish_markers, text, re.I):
        return "hinglish"
    return "en"


def analyze_text(text: str, language: str = "auto") -> dict:
    clean = (text or "").strip()
    signals: list[SignalSchema] = []
    fired: set[str] = set()

    # Negation guard: genuine safety warnings ("do NOT share your OTP") must
    # not be mistaken for scam requests. If the matched window tells the user
    # NOT to share, the credential/secrecy rules are suppressed for it.
    _NEGATION = re.compile(
        r"\b(do not|don't|dont|never|not)\s+(share|disclose|tell|reveal)|किसी को (न|मत) (बताएं|बताओ)|કોઈને કહેશો નહીં.*શેર|किसी के साथ साझा न",
        re.IGNORECASE,
    )
    _GUARDED = {"OTP_REQUEST", "PIN_PASSWORD_REQUEST"}
    _CREDENTIAL_CTX = re.compile(r"\b(otp|pin|password|code|cvv|ओटीपी|ઓટીપી)\b", re.IGNORECASE)

    for rule in RULES:
        for m in _find(rule.pattern, clean):
            if rule.rule_id in fired:
                break
            window = clean[max(0, m.start() - 25): m.end() + 25]
            if rule.rule_id in _GUARDED and _NEGATION.search(window):
                continue  # "do not share your OTP" = genuine safety advice
            if rule.rule_id == "SECRECY_PRESSURE" and _CREDENTIAL_CTX.search(window):
                continue  # secrecy about a *code* is good advice; about the *situation* is the scam tell
            excerpt = clean[max(0, m.start() - 4): m.end() + 4].strip()  # tight span: the match itself is the evidence
            signals.append(SignalSchema(
                rule_id=rule.rule_id, category=rule.category,
                excerpt=f"…{excerpt}…" if len(excerpt) < len(clean) else excerpt,
                explanation=rule.explanation, severity=rule.weight,
                severity_label=_sev_label(rule.weight), recommended_action=rule.action,
            ))
            fired.add(rule.rule_id)

    urls = extract_urls(clean)
    url_findings: list[UrlFinding] = []
    url_score = 0
    for u in urls:
        s, f, _ = analyze_url(u)
        url_findings.extend(f)
        url_score = max(url_score, s)
    if urls and url_findings:
        signals.append(SignalSchema(
            rule_id="SUSPICIOUS_URL", category="Phishing Link",
            excerpt=urls[0][:110],
            explanation="A link in this message shows suspicious patterns: " + "; ".join(x.title for x in url_findings[:3]) + ".",
            severity=min(30, max(12, url_score // 2)), severity_label=_sev_label(min(30, max(12, url_score // 2))),
            recommended_action="Do not tap the link. Visit the official site/app directly instead.",
        ))
    elif urls:
        signals.append(SignalSchema(
            rule_id="URL_PRESENT", category="Link Present",
            excerpt=urls[0][:110],
            explanation="The message contains a link. No strong deceptive patterns were found in the URL itself, but links in unexpected messages still deserve caution.",
            severity=6, severity_label="low",
            recommended_action="Hover/long-press to preview the destination; navigate via the official app where possible.",
        ))

    # ---- scoring: strongest signal anchors the score; further signals add
    # diminishing weight (60% / 40% / 25%), plus known-dangerous combo bonus.
    weights = sorted((s.severity for s in signals if s.rule_id != "URL_PRESENT"), reverse=True)
    distinct = len({s.rule_id for s in signals if s.rule_id != "URL_PRESENT"})
    base = 0.0
    for i, w in enumerate(weights):
        base += w * (1.0 if i == 0 else 0.6 if i == 1 else 0.4 if i == 2 else 0.25)
    combo_bonus = 0
    ids = {s.rule_id for s in signals}
    if "OTP_REQUEST" in ids and ("ACCOUNT_THREAT" in ids or "URGENCY" in ids):
        combo_bonus += 10
    if distinct >= 3:
        combo_bonus += 8
    risk_index = min(100, int(round(base + combo_bonus)))
    if risk_index == 0 and urls:
        risk_index = 12

    if risk_index >= 55:
        level = "high"
    elif risk_index >= 28:
        level = "medium"
    else:
        level = "low"

    suspected = "No strong scam category detected"
    for rid, label in _CATEGORY_PRIORITY:
        if rid in ids:
            suspected = label
            break

    highlights: list[str] = []
    for s in signals:
        m = re.search(re.escape(s.excerpt.strip("…")[:24]), clean)
        if s.rule_id in ("SUSPICIOUS_URL", "URL_PRESENT"):
            highlights.extend(urls)
        else:
            highlights.append(s.excerpt.strip("…").strip())

    actions: list[str] = []
    for s in sorted(signals, key=lambda x: -x.severity):
        if s.recommended_action not in actions:
            actions.append(s.recommended_action)

    if level == "high":
        summary = (f"This message shows {distinct} strong warning signal(s) consistent with {suspected.lower()}. "
                   "Do not share codes, pay money, or tap links based on it until you verify independently.")
        actions = ["Stop and do not reply, pay, or click anything in this message."] + actions
    elif level == "medium":
        summary = (f"This message shows some warning signs ({distinct} signal(s))"
                   + (f" that can appear in {suspected.lower()} cases." if suspected != "No strong scam category detected" else ".")
                   + " Treat it with caution and verify the sender through official channels.")
    else:
        summary = ("No strong scam indicators were detected in this content. It reads like a routine message — "
                   "but a low score can never guarantee that a message is genuine.")
        actions = [
            "No urgent action needed based on this scan.",
            "Still verify unexpected requests (money, codes, links) through official channels.",
        ] + [a for a in actions if a not in ("No urgent action needed based on this scan.",)]

    uncertainty = (
        "This risk index is an experimental, rule-based indicator — not a validated probability of fraud. "
        "It only reflects patterns in the text you submitted (sender identity, real domain reputation, and account "
        "context were not verified). A low score does not guarantee legitimacy, and a high score is not proof of fraud. "
        "When money or credentials are involved, always verify via official channels."
    )

    return {
        "risk_index": risk_index,
        "risk_level": level,
        "suspected_category": suspected,
        "summary": summary,
        "signals": signals,
        "highlighted_phrases": list(dict.fromkeys([h for h in highlights if h]))[:12],
        "url_findings": url_findings,
        "recommended_actions": list(dict.fromkeys(actions))[:6],
        "uncertainty_statement": uncertainty,
        "extracted_urls": urls,
        "language_detected": language if language != "auto" else detect_language(clean),
        "word_count": len(clean.split()),
    }
