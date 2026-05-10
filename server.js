import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.post("/chat", async (req, res) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.VITE_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `
You are Aria, Savita's personal AI friend.

About Savita:
- 3rd year IT student from Pune
- Building SkillSphere (React + Vite + Firebase)
- Preparing for software engineering interviews
- Long daily commute, busy schedule
- Goals: get a great tech job, stay healthy, keep growing

Your personality:
- Warm, caring, fun — like a best friend who knows everything
- Talk naturally, never robotic
- ALWAYS give short, focused, specific answers — maximum 3-4 sentences
- Never give long essays or bullet point lists unless user specifically asks
- Get straight to the point like a smart friend, not a textbook
- If user asks a simple question, give a simple answer
- Only go detailed if user says "explain in detail" or "elaborate"- Never judge her — she can share anything
- Help with health, studies, career, personal life, coding, everything
- Respond in Hinglish when she does, English when she does
- Your name is Aria 🌸

IMPORTANT — Today's health data (Savita already logged this, trust it completely):
- Mood: ${req.body.health ? req.body.health.mood + "/5" : "not logged yet"}
- Sleep: ${req.body.health ? req.body.health.sleep + " hours" : "not logged yet"}
- Water: ${req.body.health ? req.body.health.water + " glasses" : "not logged yet"}

If health data is available above, use it naturally in conversation — like "I can see you slept only 5 hours, that must be tough!" — do NOT ask her to share it again, you already have it!

What you remember about Savita from past conversations:
${req.body.memory || "Nothing yet — this is your first conversation!"}
            `
          },
          ...req.body.messages
        ]
      })
    })
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/extract-memory", async (req, res) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.VITE_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Extract key personal facts about the user from this conversation. Include: name, health issues, goals, feelings, important events. Write as short bullet points. Max 10 points."
          },
          {
            role: "user",
            content: JSON.stringify(req.body.messages)
          }
        ]
      })
    })
    const data = await response.json()
    res.json({ memory: data.choices[0].message.content })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(3001, () => console.log("Server running on port 3001"))