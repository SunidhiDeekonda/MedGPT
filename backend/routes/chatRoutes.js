import "../config/env.js";
import express from "express";
import Groq from "groq-sdk";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createSuggestedChatTitle,
  detectEmergencyConcern,
  inferRiskLevelFromReply,
} from "../utils/chatHelpers.js";

const router = express.Router();

router.use(authMiddleware);

const ALLOWED_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
};

const STRUCTURED_HEADINGS = [
  "Summary",
  "Possible Causes",
  "Risk Level",
  "Suggested Actions",
  "Warning Signs",
];

const normalizeStructuredReply = (reply) => {
  let formatted = String(reply || "").replace(/[\*\👉]/g, "").trim();

  STRUCTURED_HEADINGS.forEach((heading) => {
    const inlineHeading = new RegExp(`(^|\\n)${heading}:\\s*`, "gi");
    formatted = formatted.replace(inlineHeading, `\n${heading}:\n`);
  });

  formatted = formatted.replace(/This is not a medical diagnosis\./gi, "").trim();

  const questionMatch = formatted.match(
    /(Could you|Would you|Do you|Have you|Is it|Are you)[^?]*\?/i
  );

  let question = "";
  let before = formatted;

  if (questionMatch) {
    question = questionMatch[0].trim();
    before = formatted.replace(question, "").trim();
  }

  before = before
    .split("\n")
    .flatMap((line) => line.split(". "))
    .map((line) => line.trim())
    .filter(Boolean)
    .join(".\n");

  before = before
    .replace(/\n([A-Z][A-Za-z\s]+:)\n/g, "\n\n$1\n")
    .replace(/\n-\s*/g, "\n- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return question ? `${before}\n\n${question}`.trim() : before;
};

router.post("/", async (req, res) => {
  try {
    const groq = getGroqClient();

    if (!groq) {
      return res.status(503).json({
        reply:
          "Chat is not configured yet. Add GROQ_API_KEY to backend/.env to enable AI replies.",
      });
    }

    const message = String(req.body?.message || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const model = ALLOWED_MODELS.includes(req.body?.model)
      ? req.body.model
      : ALLOWED_MODELS[0];

    if (!message) {
      return res.status(400).json({
        reply: "Please enter a message before sending.",
      });
    }

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `
You are an intelligent, polite, and caring AI Health Assistant.

Your goal is to understand the user's condition gradually and respectfully before giving conclusions.

------------------------

CORE BEHAVIOR:

1. ALWAYS be polite and respectful
- "I understand..."
- "Thanks for sharing..."
- "If you're comfortable sharing..."
- "Could you please tell me..."
- "Would you mind letting me know..."

2. ALWAYS start with empathy
- "That sounds uncomfortable."
- "I'm sorry you're experiencing this."
- "I understand this might be concerning."

3. THEN add short reasoning
- "Since you've had this for a few days..."
- "Based on what you've shared..."

4. THEN ask ONLY ONE question politely

5. IF enough information has already been collected
- do NOT ask another question
- give the structured response directly

------------------------

FORMAT:

Line 1 -> empathy
Line 2 -> reasoning
Line 3 -> ONE polite question

------------------------

RULES:

- ONLY ONE question
- NEVER multiple questions
- NEVER jump directly to question
- NO emojis
- NO long paragraphs
- Keep clean and readable

------------------------

WHEN ENOUGH INFO:

Summary:
<summary>

Possible Causes:
- cause
- cause

Risk Level:
Low / Moderate / High

Suggested Actions:
- advice

Warning Signs:
- symptoms

End with:
"This is not a medical diagnosis."

In this final structured response:
- do not add another follow-up question
- keep each section short and clinically readable

------------------------

IMPORTANT FLOW:

If more information is needed:
Empathy -> Reason -> ONE Question

If enough information is available:
Empathy -> Brief reason -> Structured response

SAFETY RULES:
- Always state clearly that you are not a doctor and not a replacement for emergency care.
- If symptoms suggest an emergency, tell the user to seek urgent medical help immediately.
- Never provide a definitive diagnosis.
- Avoid unsafe medication dosing advice.
`,
        },
        ...history,
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = normalizeStructuredReply(
      completion.choices[0].message.content || ""
    );

    const emergencyDetected = detectEmergencyConcern(message);
    const disclaimer = "This is not a medical diagnosis.";
    const emergencyNote = emergencyDetected
      ? "If you have severe chest pain, trouble breathing, stroke symptoms, heavy bleeding, seizures, or feel unsafe, seek emergency medical care immediately."
      : "";
    const safeReply = [reply, emergencyNote, disclaimer]
      .filter(Boolean)
      .join("\n\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    res.json({
      reply: safeReply,
      meta: {
        model,
        titleSuggestion: createSuggestedChatTitle([
          ...history.map((item) => ({
            sender: item.role === "assistant" ? "bot" : "user",
            text: item.content,
          })),
          { sender: "user", text: message },
        ]),
        emergencyDetected,
        riskLevel: inferRiskLevelFromReply(safeReply),
        disclaimer,
      },
    });
  } catch (error) {
    console.error("Groq ERROR 👉", error);

    if (error.status === 401) {
      return res.status(502).json({ reply: "The AI service key is invalid. Please update GROQ_API_KEY." });
    }

    if (error.status === 429) {
      return res.status(429).json({ reply: "The AI service is busy right now. Please try again shortly." });
    }

    res.status(500).json({ reply: "Error generating response" });
  }
});

router.get("/models", (req, res) => {
  res.json({
    models: ALLOWED_MODELS.map((model) => ({
      id: model,
      label:
        model === "llama-3.3-70b-versatile"
          ? "Balanced Clinical"
          : model === "llama-3.1-8b-instant"
            ? "Fast Triage"
            : "Deep Reasoning",
    })),
  });
});

export default router;
