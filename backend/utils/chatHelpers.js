import { normalizeTitle } from "./validation.js";

const fillerPatterns = [
  /^i have\s+/i,
  /^i am\s+/i,
  /^i've been\s+/i,
  /^can you\s+/i,
  /^please\s+/i,
  /^help me with\s+/i,
];

export const createSuggestedChatTitle = (messages = []) => {
  const firstUserMessage = messages.find((message) => message.sender === "user")?.text || "";
  let titleSource = firstUserMessage.trim();

  fillerPatterns.forEach((pattern) => {
    titleSource = titleSource.replace(pattern, "");
  });

  const normalized = normalizeTitle(titleSource);
  const words = normalized.split(" ").filter(Boolean);

  if (words.length === 0) {
    return "New chat";
  }

  const candidate = words.slice(0, 8).join(" ");
  return candidate.length > 2 ? candidate : "New chat";
};

const emergencyPatterns = [
  /chest pain/i,
  /shortness of breath/i,
  /difficulty breathing/i,
  /severe bleeding/i,
  /passed out|fainted|unconscious/i,
  /stroke|face drooping|slurred speech/i,
  /seizure/i,
  /suicidal|self-harm|kill myself/i,
];

export const detectEmergencyConcern = (text = "") =>
  emergencyPatterns.some((pattern) => pattern.test(text));

export const inferRiskLevelFromReply = (reply = "") => {
  const normalized = String(reply).toLowerCase();

  if (normalized.includes("risk level:\nhigh") || normalized.includes("risk level: high")) {
    return "High";
  }

  if (
    normalized.includes("risk level:\nmoderate") ||
    normalized.includes("risk level: moderate")
  ) {
    return "Moderate";
  }

  if (normalized.includes("risk level:\nlow") || normalized.includes("risk level: low")) {
    return "Low";
  }

  return "Unknown";
};
