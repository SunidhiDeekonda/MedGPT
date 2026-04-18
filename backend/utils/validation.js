import mongoose from "mongoose";

export const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const normalizeName = (name) => String(name || "").trim().replace(/\s+/g, " ");

export const normalizeTitle = (title) =>
  String(title || "").trim().replace(/\s+/g, " ").slice(0, 80);

export const normalizeSearchQuery = (query) =>
  String(query || "").trim().replace(/\s+/g, " ").slice(0, 80);

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const isValidChatMessage = (message) => {
  if (!message || typeof message !== "object") {
    return false;
  }

  const sender = String(message.sender || "").trim();
  const text = String(message.text || "").trim();

  return Boolean(sender && text);
};

export const sanitizeMessages = (messages = []) =>
  messages
    .filter(isValidChatMessage)
    .map((message) => ({
      sender: String(message.sender).trim(),
      text: String(message.text).trim(),
    }));
