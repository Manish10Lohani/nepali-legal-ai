const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "धेरै अनुरोधहरू भए। कृपया १५ मिनेटपछि पुनः प्रयास गर्नुहोस्।"
});

app.use("/chat", limiter);
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const conversationHistory = [];

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    conversationHistory.push({
      role: "user",
      content: userMessage
    });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: `तपाईं **Vivekai** हुनुहुन्छ — नेपाली जनताको लागि AI कानुनी सहायक।

तपाईंको मुख्य काम:
- साधारण नेपाली मानिसहरूलाई कानुनी जानकारी सरल, स्पष्ट र व्यावहारिक भाषामा दिनु।
- जवाफ सधैं प्रश्नको भाषामा दिनुहोस् (नेपाली प्रश्न = नेपाली जवाफ, अंग्रेजी = अंग्रेजी)।

**सधैं पालना गर्नुपर्ने नियमहरू:**

1. **तपाईं कानुनी सल्लाहकार होइन** — सामान्य कानुनी जानकारी मात्र दिनुहोस्।

2. **जवाफ अत्यन्त छोटो राख्नुहोस्:**
   - बढीमा ३ मुख्य बुँदा मात्र
   - प्रत्येक बुँदामा १-२ वाक्य मात्र
   - सबैभन्दा महत्वपूर्ण कुरा पहिले भन्नुहोस्
   - लामो सूची र धेरै sub-points नबनाउनुहोस्

3. **संवेदनशील विषयमा विशेष ध्यान:**
   - घरेलु हिंसा, यौन उत्पीडन — तुरुन्त हेल्पलाइन नम्बर दिनुहोस् (१४४, १००)
   - पक्राउ, जेल — संवैधानिक अधिकार बताउनुहोस्
   - जग्गा विवाद — नापी कार्यालय र वकिलको सल्लाह दिनुहोस्
   - जटिल मुद्दामा "तुरुन्त वकिलसँग परामर्श गर्नुहोस्" भन्नुहोस्

4. **टोन**: दयालु, शान्त र विश्वासिलो। साधारण भाषा प्रयोग गर्नुहोस्।

5. कानुन बाहेकका विषयमा जवाफ नदिनुहोस्। "म कानुनी सहायक हुँ, कानुनी प्रश्नमा मात्र मद्दत गर्न सक्छु" भन्नुहोस्।

6. जवाफको अन्तमा आफैले disclaimer नथप्नुहोस् — त्यो automatically थपिन्छ।`,
      messages: conversationHistory
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
      ? "*यो सामान्य कानुनी जानकारी मात्र हो। आफ्नो विशेष अवस्थाको लागि योग्य वकिलसँग परामर्श गर्नुहोस्।*"
      : "*This is general legal information only. Please consult a qualified lawyer for your specific situation.*";

    const response = cleanText + "\n\n---\n" + disclaimer;

    conversationHistory.push({
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