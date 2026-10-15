# ⚖️ Vivekai — AI Legal Assistant for Nepal

**Live at [vivekai.live](https://vivekai.live)**

Vivekai is a free, bilingual (Nepali/English) AI-powered legal information assistant built for everyday Nepali people. It answers common legal questions in plain language — no lawyer fees, no complicated jargon.

---

## 🌟 What it does

- Answers legal questions in **Nepali and English**
- Covers: land/property, labor rights, family law, domestic violence, foreign employment, citizenship
- Cites relevant **Nepali laws and acts** with every answer
- Bilingual UI toggle (नेपाली / English) across all pages
- Mobile-friendly, works on any device

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JS |
| Backend | Node.js + Express |
| AI Model | Claude Haiku (Anthropic) |
| Hosting | Render.com |
| Analytics | Google Analytics |

---

## 📁 Project Structure

nepali-legal-ai/
├── index.html       # Main chat interface
├── about.html       # How it works (bilingual)
├── faq.html         # Common legal Q&A (bilingual)
├── server.js        # Express backend + Claude API
├── package.json
└── .env             # ANTHROPIC_API_KEY (not committed)

---

## 🚀 Running Locally

git clone https://github.com/Manish10Lohani/nepali-legal-ai.git
cd nepali-legal-ai
npm install
echo "ANTHROPIC_API_KEY=your_key_here" > .env
node server.js

Then open http://localhost:3000

---

## ⚙️ Key Features

- Per-user sessions — conversation history maintained per browser session, auto-cleared after 1 hour
- Rate limiting — 20 requests per 15-minute window per IP
- Prompt caching — system prompt cached with Anthropic's ephemeral cache to reduce costs
- Language detection — AI responds in the same language as the question (Nepali or English)
- Auto disclaimer — legal disclaimer appended to every response server-side
- Keep-alive ping — prevents Render free-tier sleep

---

## ⚠️ Disclaimer

Vivekai provides general legal information only — not legal advice. For serious legal matters, always consult a qualified lawyer in Nepal.

---

## 👤 Author

Built by Manish Lohani — CS graduate, McNeese State University.
Long-term vision: making Nepal's legal system accessible to everyone.

📧 lohanim77@gmail.com
