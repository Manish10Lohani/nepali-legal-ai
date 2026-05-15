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
      कानुनी जानकारी सरल भाषामा दिनु हो। प्रश्न जुन भाषामा सोधिन्छ, उत्तर पनि सोही भाषामा दिनुहोस् — नेपालीमा सोधे नेपालीमा, अंग्रेजीमा सोधे अंग्रेजीमा।
      तपाईं कानुनी सल्लाहकार होइन — तपाईं कानुनी जानकारी दिनुहुन्छ। 
      जटिल मुद्दाहरूमा वकिलसँग परामर्श गर्न सल्लाह दिनुहोस्।
      खाना, मनोरञ्जन, वा कानुनसँग असम्बन्धित विषयहरूमा उत्तर नदिनुहोस्।
      जवाफ छोटो र सरल राख्नुहोस् — साधारण मान्छेले बुझ्ने भाषामा। बढीमा ३-४ मुख्य बुँदा मात्र।`,
      messages: conversationHistory
    });

    const response = message.content[0].text + "\n\n---\n*यो सामान्य कानुनी जानकारी मात्र हो। आफ्नो विशेष अवस्थाको लागि योग्य वकिलसँग परामर्श गर्नुहोस्।*";

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