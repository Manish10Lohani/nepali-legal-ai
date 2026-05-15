const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");
require("dotenv").config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const app = express();

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
      max_tokens: 1024,
      system: `तपाईं एक नेपाली कानुनी सहायक हुनुहुन्छ। तपाईंको काम साधारण नेपाली मानिसहरूलाई 
      कानुनी जानकारी सरल भाषामा दिनु हो। प्रश्न जुन भाषामा सोधिन्छ, उत्तर पनि सोही भाषामा दिनुहोस् — नेपालीमा सोधे नेपालीमा, अंग्रेजीमा सोधे अंग्रेजीमा। यदि प्रश्न अंग्रेजी अक्षरमा छ भने अंग्रेजीमै जवाफ दिनुहोस्, भले पनि नेपालको बारेमा कुरा गरिएको होस्।
      तपाईं कानुनी सल्लाहकार होइन — तपाईं कानुनी जानकारी दिनुहुन्छ। 
      जटिल मुद्दाहरूमा वकिलसँग परामर्श गर्न सल्लाह दिनुहोस्।
      खाना, मनोरञ्जन, वा कानुनसँग असम्बन्धित विषयहरूमा उत्तर नदिनुहोस्। जवाफको अन्तमा आफैले disclaimer नथप्नुहोस् — त्यो automatically थपिन्छ।
      जवाफ छोटो र सरल राख्नुहोस् — साधारण मान्छेले बुझ्ने भाषामा। बढीमा ३-४ मुख्य बुँदा मात्र।`,
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