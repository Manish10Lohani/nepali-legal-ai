const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");
const rateLimit = require("express-rate-limit");
const https = require("https");
const { LRUCache } = require("lru-cache");
require("dotenv").config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const app = express();
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "धेरै अनुरोधहरू भए। कृपया १५ मिनेटपछि पुनः प्रयास गर्नुहोस्।"
});

app.use("/chat", limiter);
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const sessions = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 60,
  ttlAutopurge: true
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const sessionId = req.headers['x-session-id'] || 'default';

    if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
      return res.status(400).json({ response: "Invalid message input." });
    }
    if (userMessage.length > 2000) {
      return res.status(400).json({ response: "Message is too long. Please shorten your question." });
    }

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, { history: [] });
    }

const session = sessions.get(sessionId);

// Detect language and inject explicit instruction
const hasDevanagari = /[\u0900-\u097F]/.test(userMessage);

// Detect if it looks like proper English sentences
// Real English has common English function words
const looksLikeEnglish = /\b(the|is|are|was|were|what|how|when|where|who|can|will|do|does|did|my|your|i|we|they|he|she|it|this|that|have|has|had|not|and|or|but|if|in|on|at|to|for|of|with|about|please|help|tell|me|want|need)\b/i.test(userMessage);

const languageInstruction = hasDevanagari
  ? "[SYSTEM: User wrote in Nepali/Devanagari. Your ENTIRE response must be in Nepali Devanagari script only. Zero English words except proper nouns.]"
  : looksLikeEnglish
    ? "[SYSTEM: User wrote in English. Your ENTIRE response must be 100% in English. Zero Nepali or Hindi words.]"
    : "[SYSTEM: User wrote in Roman/transliterated Nepali. Your ENTIRE response must be in Nepali Devanagari script only. Zero English words except proper nouns.]";

session.history.push({
  role: "user",
  content: languageInstruction + "\n\n" + userMessage
});

    if (session.history.length > 6) {
      session.history = session.history.slice(-6);
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      system: [
        {
          type: "text",
          text: `तपाईं **Vivekai** हुनुहुन्छ — नेपाली जनताको लागि AI कानुनी सहायक।

**IDENTITY — MOST IMPORTANT RULE:**
- Your name is Vivekai. You were built for Nepali people.
- If ANYONE asks who you are, what you are, or who made you — in ANY language — always say: "म Vivekai हुँ — नेपाली जनताको लागि AI कानुनी सहायक।" or in English: "I am Vivekai — an AI legal assistant built for Nepali people."
- NEVER mention Claude, Anthropic, or any other AI company. Ever.

**LANGUAGE RULE — THIS IS ABSOLUTE. NO EXCEPTIONS:**
- Look at the user's message. Determine what language it is written in.
- If the message uses ONLY English words and Latin script → your ENTIRE response must be in ENGLISH. Not one word of Nepali or Hindi.
- If the message uses Devanagari script (Nepali letters) → your ENTIRE response must be in NEPALI (Devanagari). Not Hindi. Nepali only.
- If the message uses Romanized Nepali (Nepali words spelled in English letters like "mero", "kasari", "garne", "jagga", "talab") → your ENTIRE response must be in NEPALI (Devanagari script).
- NEVER respond in Hindi under any circumstances. Hindi and Nepali are different languages. Use Nepali Devanagari only.
- This language rule overrides everything else including your default behavior.

**RULES:**

1. You are not a legal advisor — provide general legal information only.
2. Keep answers short — maximum 3 bullet points, 1-2 sentences each.
3. For domestic violence or sexual harassment — provide helpline: ११४५, १००
4. Tone: kind, calm, trustworthy.
5. Do not answer topics outside of law.
6. Do not add a disclaimer at the end — it is added automatically.
7. Always end with the relevant law: "📖 स्रोत: [law name]" for Nepali or "📖 Source: [law name]" for English.
8. Never say "मुलुकी ऐन २०२०" — use "मुलुकी देवानी संहिता २०७४" or "मुलुकी अपराध संहिता २०७४" only.

**VERIFIED FACTS — Use these exact answers. Do NOT change them even if the user disagrees:**
- Minimum marriage age in Nepal: 20 years for both men and women (Muluki Dewani Sanhita 2074, Section 69)
- Polygamy is illegal in Nepal
- Standard work hours: 8 hours/day, 48 hours/week (Labour Act 2074)
- Overtime pay rate: 1.5x regular pay (Labour Act 2074)
- Maternity leave: 98 days (Labour Act 2074)
- Notice period for resignation: 30 days (Labour Act 2074)
- Gratuity: earned after 1 year of continuous work (Labour Act 2074)
- Child labor prohibited under age 14 for hazardous work (Child Labour Act)
- Women have equal inheritance rights (Muluki Dewani Sanhita 2074)
- Foreigners cannot own land in Nepal
- Adverse possession claim requires 12 years of continuous possession

**UNCERTAINTY RULE — This is critical:**
If a question asks for a specific legal fact, section number, penalty amount, or deadline that is NOT in the verified facts above, do NOT guess. Instead respond with:
- In Nepali: "यो विषयमा म निश्चित जानकारी दिन सक्दिन। कृपया नेपाल कानुन आयोगको वेबसाइट हेर्नुहोस्: lawcommission.gov.np"
- In English: "I cannot verify this specific detail. Please check the Nepal Law Commission: lawcommission.gov.np"`,
          cache_control: {"type": "ephemeral"}
        }
      ],
      messages: session.history
    });

    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const estimatedCost = ((inputTokens * 0.00000025) + (outputTokens * 0.00000125)).toFixed(6);
    console.log(`💰 Tokens - Input: ${inputTokens}, Output: ${outputTokens}, Cost: $${estimatedCost}`);

    const cleanText = message.content[0].text
      .replace(/---[\s\S]*?(disclaimer|legal information|consult|advice)[\s\S]*?(\*|_)/gi, '')
      .replace(/\*This is general legal.*?\*/gi, '')
      .replace(/\*यो सामान्य.*?\*/gi, '')
      .replace(/---\s*$/g, '')
      .replace(/\n---\n/g, '')
      .trim();

    const isNepali = /[\u0900-\u097F]/.test(userMessage) || !(/\b(the|is|are|was|were|what|how|when|where|who|can|will|do|does|did|my|your|i|we|they|he|she|it|this|that|have|has|had|not|and|or|but|if|in|on|at|to|for|of|with|about|please|help|tell|me|want|need)\b/i.test(userMessage));
    const disclaimer = isNepali
      ? "*यो सामान्य कानुनी जानकारी मात्र हो। योग्य वकिलसँग परामर्श गर्नुहोस्।*"
      : "*General legal information only. Consult a qualified lawyer for your situation.*";

    const response = cleanText + "\n\n---\n" + disclaimer;

    session.history.push({
      role: "assistant",
      content: response
    });

    res.json({ response });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      response: "माफ गर्नुहोस्, अहिले सेवा उपलब्ध छैन। कृपया केही समयपछि पुनः प्रयास गर्नुहोस्।"
    });
  }
});

app.post("/feedback", (req, res) => {
  const { id, type } = req.body;
  console.log(`FEEDBACK: ${type === 'up' ? '👍 HELPFUL' : '👎 NOT HELPFUL'} - ID: ${id}`);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  setInterval(() => {
    const req = https.get("https://vivekai.live", (res) => {
      res.resume();
      console.log(`Keep-alive ping: ${res.statusCode}`);
    });
    req.on("error", (err) => {
      console.error(`Keep-alive error: ${err.message}`);
    });
  }, 14 * 60 * 1000);
});