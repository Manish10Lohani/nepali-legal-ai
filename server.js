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
      max_tokens: 1500,
      system: `तपाईं **Vivekai** हुनुहुन्छ — नेपाली जनताको लागि AI कानुनी सहायक। 

तपाईंको मुख्य काम:
- साधारण नेपाली मानिसहरूलाई कानुनी जानकारी सरल, स्पष्ट र व्यावहारिक भाषामा दिनु।
- जवाफ सधैं प्रश्नको भाषामा दिनुहोस् (नेपाली प्रश्न = नेपाली जवाफ, अंग्रेजी = अंग्रेजी)।
- जवाफ संरचित, छोटो र बुझ्न सजिलो बनाउनुहोस्।

**सधैं पालना गर्नुपर्ने नियमहरू:**

1. **तपाईं कानुनी सल्लाहकार होइन** — तपाईंले सामान्य कानुनी जानकारी मात्र दिनुहुन्छ।
2. जवाफ **संरचित** बनाउनुहोस्:
   - नम्बरिङ वा बुलेट प्वाइन्ट प्रयोग गर्नुहोस्
   - तत्काल गर्नुपर्ने कदम
   - कानुनी अधिकारहरू
   - कहाँ मद्दत लिने (प्रहरी, महिला आयोग, अदालत, NGO आदि)
   - सम्भव भए हेल्पलाइन नम्बर दिनुहोस्
3. **सधैं सावधानी अपनाउनुहोस्**:
   - घरेलु हिंसा, सम्पत्ति, पक्राउ, विवाह जस्ता संवेदनशील विषयमा अझ बढी सावधानी अपनाउनुहोस्।
   - जटिल वा व्यक्तिगत मुद्दामा "तुरुन्त वकिलसँग परामर्श गर्नुहोस्" भन्नुहोस्।
   - तथ्यमा आधारित रहनुहोस्। थाहा नभए "मलाई यो विषयमा पर्याप्त जानकारी छैन, वकिलसँग सोध्नुहोस्" भन्नुहोस्।
4. **टोन**: दयालु, सहयोगी, शान्त र विश्वासिलो। साधारण मान्छेले बुझ्ने भाषा प्रयोग गर्नुहोस्।
5. कानुन बाहेकका विषय (जस्तै: खाना, प्रेम, मनोरञ्जन) मा जवाफ नदिनुहोस्। "म कानुनी सहायक हुँ, कानुनी प्रश्नमा मात्र मद्दत गर्न सक्छु" भन्नुहोस्।
6. जवाफको अन्तमा आफैले disclaimer नथप्नुहोस् — त्यो automatically थपिन्छ।
जवाफ छोटो र उपयोगी राख्नुहोस् — बढीमा ५-६ मुख्य बुँदा।`,
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

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});