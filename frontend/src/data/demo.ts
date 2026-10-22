export interface DemoScenario {
  id: string
  title: string
  label: string
  expected: string
  text: string
}

/** All examples are fictional/synthetic — created for education only. */
export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'banking',
    title: 'Scenario 1 — Fake Banking Alert',
    label: 'Fictional demo',
    expected: 'Expected: HIGH warning. OTP request + account-block threat + fake KYC + suspicious link should all be highlighted.',
    text: 'Dear customer, your SBI account will be blocked within 2 hours due to incomplete KYC. Update your KYC immediately and share the OTP sent to your mobile to verify your account. Click here to verify now: http://sbi-kyc-verify.xyz/login',
  },
  {
    id: 'job',
    title: 'Scenario 2 — Fake Job Offer',
    label: 'Fictional demo',
    expected: 'Expected: MEDIUM–HIGH warning. Advance registration-fee request is the key red flag. We must not assert the business is fraudulent without evidence.',
    text: 'Congratulations Priya Sharma! You have been selected for a Work From Home Data Entry job at TechVision Solutions. Salary: Rs 45,000/month, no experience needed. To generate your offer letter, please pay a refundable registration fee of Rs 1,499 via UPI today. Limited seats, confirm immediately!',
  },
  {
    id: 'normal',
    title: 'Scenario 3 — Normal Appointment Reminder',
    label: 'Fictional demo',
    expected: 'Expected: LOW warning. No strong scam indicators — and the report must still say low score ≠ guaranteed genuine.',
    text: 'Hello, this is a reminder from CityCare Dental Clinic. Your appointment with Dr. Patel Mehta is tomorrow, 12 August at 10:30 AM. Please arrive 10 minutes early and bring your previous reports. To reschedule, reply to this message. Thank you!',
  },
  {
    id: 'prize',
    title: 'Bonus — Lottery Prize Lure',
    label: 'Fictional demo',
    expected: 'Expected: HIGH warning for prize/claim pattern.',
    text: 'CONGRATULATIONS! Your mobile number has won Rs 25,00,000 in the Mega Lucky Draw lottery. To claim your prize, share your bank account details and pay a processing charge. Offer valid today only!',
  },
  {
    id: 'hinglish',
    title: 'Bonus — Hinglish Bank Scam',
    label: 'Fictional demo',
    expected: 'Expected: HIGH warning — Hinglish OTP + account-band patterns detected.',
    text: 'Sir aapka bank account band ho jayega, KYC update karna hai. Turant OTP batao jo aapke phone par aaya hai, warna card block ho jayega. Abhi karo, sirf 1 ghanta bacha hai.',
  },
]

export interface QuizQuestion {
  id: string
  category: string
  scenario: string
  question: string
  options: string[]
  correct: number
  explanation: string
}

export const QUIZ: QuizQuestion[] = [
  {
    id: 'q1', category: 'Bank Alert',
    scenario: '"Dear customer, your account will be blocked today. Share the OTP to verify your KYC: http://bank-verify.xyz"',
    question: 'What is the safest action?',
    options: ['Share the OTP quickly before the account blocks', 'Click the link and check if it looks real', 'Ignore the message and check your account in the official bank app', 'Reply asking if they are really from the bank'],
    correct: 2,
    explanation: 'Banks never ask for OTPs or send KYC links by SMS. Blocking threats + OTP request + strange link = classic phishing. Always verify inside the official app.',
  },
  {
    id: 'q2', category: 'Job Offer',
    scenario: '"Selected for WFH job, ₹45,000/month! Pay ₹1,499 registration fee via UPI to get your offer letter."',
    question: 'Which is the biggest red flag here?',
    options: ['The salary is paid monthly', 'They ask YOU to pay a fee to get hired', 'The job is work-from-home', 'They contacted you on WhatsApp'],
    correct: 1,
    explanation: 'Legitimate employers never charge candidates registration/security fees. Pay-to-get-hired is the core of advance-fee job scams.',
  },
  {
    id: 'q3', category: 'UPI / QR',
    scenario: 'A buyer on a resale app sends you a QR code and says: "Scan this and enter your UPI PIN to receive your payment."',
    question: 'What will actually happen if you scan and enter the PIN?',
    options: ['You will receive the money', 'Money will be deducted from YOUR account', 'Nothing, QR codes are only for shops', 'The app will block it automatically'],
    correct: 1,
    explanation: 'Scanning a QR + entering a UPI PIN always SENDS money. Receiving money needs only your UPI ID — never a PIN.',
  },
  {
    id: 'q4', category: 'Suspicious URL',
    scenario: 'You receive: "Verify your account: https://hdfc.secure-login-verify.xyz/update"',
    question: 'What is the real domain of this link?',
    options: ['hdfc', 'secure-login-verify.xyz', 'hdfc.secure-login-verify', 'update'],
    correct: 1,
    explanation: 'The registrable domain is the last two parts: secure-login-verify.xyz. "hdfc" is just a subdomain anyone can create. Official HDFC Bank uses hdfcbank.com.',
  },
  {
    id: 'q5', category: 'Impersonation',
    scenario: 'A "police officer" on a video call says you are under "digital arrest" and must transfer money to a "safe account" for verification, and not tell anyone.',
    question: 'What should you do?',
    options: ['Transfer a small amount to check', 'Stay on the call and cooperate', 'Disconnect immediately — police never do digital arrests or demand transfers', 'Ask them to send an official email first'],
    correct: 2,
    explanation: '"Digital arrest" does not exist. Authority threats + secrecy + money transfer is a well-known impersonation scam. Disconnect and call 1930 (India).',
  },
  {
    id: 'q6', category: 'Routine Message',
    scenario: '"Reminder: Your dental appointment is tomorrow at 10:30 AM. Please arrive 10 minutes early. — CityCare Clinic" (ScamShield score: Low)',
    question: 'What does a LOW risk score mean?',
    options: ['The message is 100% genuine', 'No strong scam patterns were found — but low score never guarantees legitimacy', 'The clinic is government-verified', 'You can safely share personal details with the sender'],
    correct: 1,
    explanation: 'Automated detection only matches known patterns in the text. It cannot verify the real sender. Low = fewer red flags, never a guarantee.',
  },
]

/** Synthetic demonstration data — NOT real cybercrime statistics. */
export const SYNTHETIC = {
  trend: [
    { day: 'Mon', scans: 42, flagged: 11 }, { day: 'Tue', scans: 55, flagged: 16 },
    { day: 'Wed', scans: 61, flagged: 19 }, { day: 'Thu', scans: 58, flagged: 14 },
    { day: 'Fri', scans: 74, flagged: 24 }, { day: 'Sat', scans: 89, flagged: 31 },
    { day: 'Sun', scans: 80, flagged: 27 },
  ],
  categories: [
    { name: 'Bank / KYC Fraud', value: 32 }, { name: 'Fake Job Offers', value: 21 },
    { name: 'Prize / Lottery', value: 14 }, { name: 'UPI / Payment', value: 17 },
    { name: 'Investment', value: 9 }, { name: 'Impersonation', value: 7 },
  ],
  signals: [
    { signal: 'Urgency pressure', count: 148 }, { signal: 'Suspicious link', count: 121 },
    { signal: 'OTP request', count: 96 }, { signal: 'Account-block threat', count: 88 },
    { signal: 'Fake KYC', count: 74 }, { signal: 'Advance fee', count: 52 },
  ],
  languages: [
    { name: 'English', value: 46 }, { name: 'Hinglish', value: 27 },
    { name: 'Hindi', value: 17 }, { name: 'Gujarati', value: 10 },
  ],
}
