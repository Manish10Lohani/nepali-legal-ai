const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");

require("dotenv").config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const conversationHistory = [];

async function ask(question) {
  conversationHistory.push({
    role: "user",
    content: question
  });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: `तपाईं एक नेपाली कानुनी सहायक हुनुहुन्छ। तपाईंको काम साधारण नेपाली मानिसहरूलाई 
    कानुनी जानकारी सरल भाषामा दिनु हो। तपाईं नेपाली र अंग्रेजी दुवै भाषामा उत्तर दिन सक्नुहुन्छ। 
    तपाईं कानुनी सल्लाहकार होइन — तपाईं कानुनी जानकारी दिनुहुन्छ। 
    जटिल मुद्दाहरूमा वकिलसँग परामर्श गर्न सल्लाह दिनुहोस्।
    खाना, मनोरञ्जन, वा कानुनसँग असम्बन्धित विषयहरूमा उत्तर नदिनुहोस्।`,
    messages: conversationHistory
  });

  const response = message.content[0].text;
  
  conversationHistory.push({
    role: "assistant",
    content: response
  });

  console.log("\nSahayak:", response, "\n");
}

function chat() {
  rl.question("Hajur: ", async (input) => {
    if (input.toLowerCase() === "exit") {
      console.log("Dhanyabad! Pheri bhetnehola.");
      rl.close();
      return;
    }

    await ask(input);
    chat();
  });
}

console.log("=== नेपाली कानुनी सहायक ===\n");
chat();