const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose.connect("mongodb://localhost:27017/uber_clone");

// Schema for chat messages
const messageSchema = new mongoose.Schema({
  sender: String, // "user" or "bot"
  text: String,
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("ChatBot", messageSchema);

// --- Hardcoded website context ---
const websiteContext = `
You are a chatbot for a ride-booking platform. Key features:
- Users can book rides within 1 km radius of available drivers.
- Services provided: bike, auto, cab.
- Users can message or call drivers via the app.
- Drivers can choose the fastest or shortest route.
- Fare estimation is available.
- Users can track rides in real-time.
- Provide clear guidance if user asks about booking, ride status, or fare.
- If user or driver asks anything unrelated, provide a polite hardcoded response:
  "Sorry, I can only answer questions about our ride-booking services."
`;

// Groq AI API call
const generateAIReply = async (userMessage) => {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "groq/compound-mini",   // Use a free or available Groq model
        messages: [{ role: "user", content: userMessage }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.choices && response.data.choices[0]?.message?.content) {
      return response.data.choices[0].message.content;
    }

    return "Sorry, I didn't understand that.";
  } catch (err) {
    // Check for quota or other known errors
    if (err.response?.data?.error?.message?.includes("quota") || 
        err.response?.status === 429) {
      console.warn("Groq AI quota exceeded. Returning fallback response.");
      return "Sorry, the AI service limit has been reached. Please try again later.";
    }
    console.error(err.response?.data || err.message);
    return "Sorry, I am unable to respond now.";
  }
};


// --- Routes ---
app.get("/", (req, res) => {
  res.send("Ride-booking chat server is running!");
});

// Send message
app.post("/api/message", async (req, res) => {
  const { text } = req.body;

  // Save user message
  const userMsg = new Message({ sender: "user", text });
  await userMsg.save();

  // Generate bot reply
  const botText = await generateAIReply(text);

  // Save bot message
  const botMsg = new Message({ sender: "bot", text: botText });
  await botMsg.save();

  res.json(botMsg);
});

// Get all messages
app.get("/api/messages", async (req, res) => {
  const messages = await Message.find().sort({ timestamp: 1 });
  res.json(messages);
});

// Start server
app.listen(3004, () => console.log("Server running on port 3004"));
