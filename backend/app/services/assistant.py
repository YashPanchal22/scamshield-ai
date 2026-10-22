"""Rule-based multilingual safety assistant (works with no LLM key)."""
from __future__ import annotations

INTENTS = [
    {
        "keys": ["otp", "code", "ओटीपी", "code share", "ओटीपी मांगा", "ઓટીપી"],
        "en": ("Never share an OTP with anyone — not with bank staff, police, delivery agents, or 'customer care'. "
               "An OTP is your digital signature: whoever has it can authorise transactions as you. "
               "If someone is asking for an OTP on a call/chat, treat it as a scam attempt and disconnect."),
        "hi": ("OTP कभी किसी के साथ शेयर न करें — न बैंक कर्मचारी, न पुलिस, न कस्टमर केयर के साथ। "
               "OTP आपका डिजिटल हस्ताक्षर है। अगर कोई कॉल/चैट पर OTP मांग रहा है तो यह ठगी है — तुरंत फोन काट दें।"),
        "hinglish": ("OTP kabhi kisi ko mat batao — bank wale, police, customer care, koi bhi ho. "
                     "OTP matlab aapke signature jaisa hai. Jo call/chat par OTP maange, samjho scam hai — phone kaat do."),
        "gu": ("OTP ક્યારેય કોઈને આપશો નહીં — બેંક કર્મચારી, પોલીસ કે કસ્ટમર કેરને પણ નહીં. "
               "OTP તમારી ડિજિટલ સહી છે. કોઈ કોલ/ચેટ પર OTP માંગે તો તે કૌભાંડ છે — તરત ફોન કાપો."),
        "checklist": ["Disconnect the call/chat asking for the OTP", "Call your bank on the number printed on your card", "If OTP already shared: call 1930 (India) and your bank immediately", "Change passwords/PIN from a trusted device"],
    },
    {
        "keys": ["job", "नौकरी", "નોકરી", "recruit", "vacancy", "work from home", "telegram task"],
        "en": ("Real employers never ask you to pay a registration fee, security deposit, or 'training charge' to get a job. "
               "Verify offers only on the company's official careers page, check the email domain, and never pay via UPI/gift cards. "
               "Very high pay for liking videos/typing tasks is a classic task-scam pattern."),
        "hi": ("असली कंपनी नौकरी के लिए रजिस्ट्रेशन फीस या सिक्योरिटी डिपॉज़िट कभी नहीं मांगती। "
               "ऑफर कंपनी की आधिकारिक careers वेबसाइट पर जाँचें, ईमेल डोमेन देखें, UPI से पैसा न भेजें।"),
        "hinglish": ("Real company job ke liye paise kabhi nahi maangti — registration fee, deposit, training charge sab scam signal hai. "
                     "Offer ko company ki official careers page par verify karo, aur UPI se payment mat karo."),
        "gu": ("સાચી કંપની નોકરી માટે રજિસ્ટ્રેશન ફી કે ડિપોઝિટ ક્યારેય માંગતી નથી. "
               "ઓફર કંપનીની અધિકૃત careers પેજ પર ચકાસો અને UPI થી પૈસા ન મોકલો."),
        "checklist": ["Find the job on the company's official careers page", "Check the sender's email domain matches the company", "Never pay any fee/deposit to get hired", "Search '<company> + scam' before sharing documents"],
    },
    {
        "keys": ["paid", "sent money", "transfer", "money gone", "पैसे भेज दिए", "પૈસા ગયા", "lost money", "deducted", "fraud ho gaya"],
        "en": ("Act fast — speed matters. Call the cyber-fraud helpline 1930 (India) and your bank right now and ask them to freeze/stop the transfer. "
               "Then file a complaint at cybercrime.gov.in with screenshots, transaction IDs, and the scammer's number/UPI ID. "
               "ScamShield cannot freeze accounts or recover money — only your bank and authorities can."),
        "hi": ("तुरंत कार्रवाई करें — समय बहुत ज़रूरी है। अभी 1930 पर कॉल करें और अपने बैंक को ट्रांसफर रोकने के लिए कहें। "
               "फिर cybercrime.gov.in पर शिकायत दर्ज करें। ScamShield पैसा वापस नहीं कर सकता — यह बैंक और पुलिस ही कर सकते हैं।"),
        "hinglish": ("Turant action lo — time sabse important hai. Abhi 1930 par call karo aur bank ko transfer rokne bolo. "
                     "Phir cybercrime.gov.in par complaint karo. ScamShield paise wapas nahi kar sakta — bank aur police hi madad karenge."),
        "gu": ("તરત પગલાં લો — સમય બહુ મહત્વનો છે. હમણાં 1930 પર કોલ કરો અને બેંકને ટ્રાન્સફર રોકવા કહો. "
               "પછી cybercrime.gov.in પર ફરિયાદ કરો. ScamShield પૈસા પાછા આપી શકતું નથી — બેંક અને પોલીસ જ મદદ કરશે."),
        "checklist": ["Call 1930 (India cyber-fraud helpline) immediately", "Call your bank/payment app support via official number", "Preserve screenshots, transaction ID, scammer's number/UPI ID", "File a report at https://cybercrime.gov.in", "Change PINs/passwords from a trusted device"],
    },
    {
        "keys": ["qr", "upi pin", "receive money", "पैसे प्राप्त", "refund pin"],
        "en": ("You NEVER need to enter a UPI PIN or scan a QR code to *receive* money or a refund. Scanning + PIN always *sends* money. "
               "If a buyer/refund agent sends you a QR code to 'receive payment', it is a scam."),
        "hi": ("पैसे प्राप्त करने के लिए UPI PIN डालने या QR स्कैन करने की कभी ज़रूरत नहीं होती। QR + PIN मतलब आप पैसा भेज रहे हैं।"),
        "hinglish": ("Paise receive karne ke liye UPI PIN ya QR scan ki kabhi zarurat nahi hoti. QR scan + PIN matlab aap paise BHEJ rahe ho."),
        "gu": ("પૈસા મેળવવા માટે UPI PIN કે QR સ્કેનની ક્યારેય જરૂર નથી. QR + PIN એટલે તમે પૈસા મોકલી રહ્યા છો."),
        "checklist": ["PIN = paying, always. No exceptions", "To receive money, only share your UPI ID/phone number", "Verify payee name shown before approving any payment"],
    },
    {
        "keys": ["link", "clicked", "website", "लिंक खोला", "લિંક ખોલી", "phishing"],
        "en": ("If you opened a suspicious link but entered nothing, close it and monitor your accounts. If you entered a password/OTP/card details, "
               "assume they're compromised: change that password from a trusted device, enable 2FA, revoke sessions, and alert your bank. "
               "Never re-open the link to 'check' it."),
        "hi": ("अगर आपने संदिग्ध लिंक खोला लेकिन कुछ डाला नहीं, तो उसे बंद करके खातों पर नज़र रखें। "
               "अगर पासवर्ड/OTP डाला है तो तुरंत trusted डिवाइस से पासवर्ड बदलें और बैंक को बताएं।"),
        "hinglish": ("Agar link khola but kuch enter nahi kiya, toh band karke accounts monitor karo. "
                     "Agar password/OTP dala hai toh turant trusted device se password change karo aur bank ko batao."),
        "gu": ("જો લિંક ખોલી પણ કંઈ નાખ્યું નથી, તો બંધ કરીને એકાઉન્ટ પર નજર રાખો. "
               "જો પાસવર્ડ/OTP નાખ્યો હોય તો trusted ડિવાઇસથી પાસવર્ડ બદલો અને બેંકને જાણ કરો."),
        "checklist": ["Do not re-open the link", "Change any password you entered (from a trusted device)", "Enable two-factor authentication", "Watch bank statements for 2-4 weeks"],
    },
    {
        "keys": ["anydesk", "teamviewer", "screen share", "app install", "remote"],
        "en": ("Remote-access apps (AnyDesk, TeamViewer etc.) let a stranger see your screen and OTPs. If you installed one for a 'refund/support' call, "
               "uninstall it now, disconnect from the internet, call your bank to block transactions, and change passwords from a different trusted device."),
        "hi": ("AnyDesk/TeamViewer जैसी ऐप्स से ठग आपकी स्क्रीन और OTP देख सकते हैं। इंस्टॉल की है तो तुरंत हटाएं, बैंक को कॉल करें।"),
        "hinglish": ("AnyDesk/TeamViewer jaise apps se scammer aapki screen aur OTP dekh sakta hai. Install kiya hai toh turant uninstall karo, bank ko call karo."),
        "gu": ("AnyDesk/TeamViewer જેવી એપથી ઠગ તમારી સ્ક્રીન અને OTP જોઈ શકે છે. ઇન્સ્ટોલ કરી હોય તો તરત કાઢો, બેંકને કોલ કરો."),
        "checklist": ["Uninstall the remote-access app immediately", "Call your bank and request a transaction hold", "Change banking passwords from a trusted device", "Run a reputable antivirus scan"],
    },
]

DEFAULT = {
    "en": ("I can help you check warning signs in messages, explain OTP/banking safety, verify job offers, stay safe with payments, "
           "and guide you if money was already sent. Paste the suspicious message into the Scanner for an evidence-based report, "
           "or ask me things like 'Someone asked for my OTP' or 'I already sent money, what now?'"),
    "hi": "मैं संदेशों में चेतावनी संकेत, OTP सुरक्षा, नौकरी ऑफर सत्यापन और सुरक्षित भुगतान में मदद कर सकता हूँ। संदिग्ध संदेश को स्कैनर में डालें या मुझसे पूछें।",
    "hinglish": "Main message ke warning signs, OTP safety, job offer verify, aur safe payment mein help kar sakta hoon. Suspicious message Scanner mein daalo ya mujhse poochho.",
    "gu": "હું મેસેજના ચેતવણી સંકેતો, OTP સુરક્ષા, નોકરી ઓફર ચકાસણી અને સુરક્ષિત પેમેન્ટમાં મદદ કરી શકું છું. શંકાસ્પદ મેસેજ સ્કેનરમાં નાખો અથવા મને પૂછો.",
}

SUGGESTED = [
    "Someone is asking for my OTP — what should I do?",
    "I already sent money to a scammer. What now?",
    "Do I need a UPI PIN to receive a refund?",
    "How do I verify a job offer?",
    "I clicked a suspicious link. Am I safe?",
    "A caller asked me to install AnyDesk",
]


def assistant_reply(message: str, language: str = "en") -> dict:
    lang = language if language in ("en", "hi", "hinglish", "gu") else "en"
    text = message.lower()
    for intent in INTENTS:
        if any(k in text for k in intent["keys"]):
            return {
                "reply": intent.get(lang) or intent["en"],
                "checklist": intent["checklist"],
                "suggested_questions": SUGGESTED,
                "source": "rule-based-fallback (no LLM key configured)",
            }
    return {
        "reply": DEFAULT.get(lang, DEFAULT["en"]),
        "checklist": ["Never share OTP/PIN/passwords", "Verify via official apps/websites only", "Receiving money never needs a PIN", "When in doubt, call 1930 (India) or your bank"],
        "suggested_questions": SUGGESTED,
        "source": "rule-based-fallback (no LLM key configured)",
    }
