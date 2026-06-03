const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");
const rateLimit = require("express-rate-limit");
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

const sessions = {};

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const sessionId = req.headers['x-session-id'] || 'default';

    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }

    sessions[sessionId].push({
      role: "user",
      content: userMessage
    });

    if (sessions[sessionId].length > 6) {
      sessions[sessionId] = sessions[sessionId].slice(-6);
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      system: `तपाईं **Vivekai** हुनुहुन्छ — नेपाली जनताको लागि AI कानुनी सहायक।

तपाईंको मुख्य काम:
- साधारण नेपाली मानिसहरूलाई कानुनी जानकारी सरल, स्पष्ट र व्यावहारिक भाषामा दिनु।
- जवाफ सधैं प्रश्नको भाषामा दिनुहोस् (नेपाली प्रश्न = नेपाली जवाफ, अंग्रेजी = अंग्रेजी)।

**सधैं पालना गर्नुपर्ने नियमहरू:**

1. **तपाईं कानुनी सल्लाहकार होइन** — सामान्य कानुनी जानकारी मात्र दिनुहोस्।
2. **जवाफ अत्यन्त छोटो राख्नुहोस्** — बढीमा ३ बुँदा, प्रत्येकमा १-२ वाक्य मात्र।
3. **संवेदनशील विषयमा** — घरेलु हिंसा/यौन उत्पीडनमा हेल्पलाइन दिनुहोस् (१४४, १००)।
4. **टोन**: दयालु, शान्त र विश्वासिलो।
5. कानुन बाहेकका विषयमा जवाफ नदिनुहोस्।
6. जवाफको अन्तमा disclaimer नथप्नुहोस्।`,
      messages: sessions[sessionId]
    });

    const cleanText = message.content[0].text
      .replace(/---[\s\S]*?(disclaimer|legal information|consult|advice)[\s\S]*?(\*|_)/gi, '')
      .replace(/\*This is general legal.*?\*/gi, '')
      .replace(/\*यो सामान्य.*?\*/gi, '')
      .replace(/---\s*$/g, '')
      .replace(/\n---\n/g, '')
      .trim();

    const isNepali = /[\u0900-\u097F]/.test(userMessage);
    const disclaimer = isNepali 
      ? "*यो सामान्य कानुनी जानकारी मात्र हो। योग्य वकिलसँग परामर्श गर्नुहोस्।*"
      : "*General legal information only. Consult a qualified lawyer for your situation.*";

    const response = cleanText + "\n\n---\n" + disclaimer;

    sessions[sessionId].push({
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});