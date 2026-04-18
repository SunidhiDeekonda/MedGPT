import express from "express";
import Chat from "../models/Chat.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { isDatabaseConnected } from "../config/db.js";
import {
  isValidObjectId,
  normalizeSearchQuery,
  normalizeTitle,
  sanitizeMessages,
} from "../utils/validation.js";
import { createSuggestedChatTitle } from "../utils/chatHelpers.js";

const router = express.Router();

router.use(authMiddleware);

const createChatDocument = async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: "Chat history is temporarily unavailable." });
    }

    const messages = sanitizeMessages(req.body?.messages);
    const title = normalizeTitle(req.body?.title) || createSuggestedChatTitle(messages);
    const model = String(req.body?.model || "llama-3.3-70b-versatile").trim();
    const riskLevel = String(req.body?.riskLevel || "Unknown").trim();

    if (messages.length === 0) {
      return res.status(400).json({ error: "A chat must contain at least one valid message." });
    }

    const newChat = new Chat({
      user: req.user.id,
      title,
      messages,
      model,
      riskLevel,
    });

    await newChat.save();
    res.json(newChat);
  } catch (err) {
    console.error("Failed to save chat:", err);
    res.status(500).json({ error: "Failed to save chat" });
  }
};

router.post("/", createChatDocument);
router.post("/save", createChatDocument);

router.get("/all", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: "Chat history is temporarily unavailable." });
    }

    const searchQuery = normalizeSearchQuery(req.query?.q);
    const query = { user: req.user.id };

    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { "messages.text": { $regex: searchQuery, $options: "i" } },
      ];
    }

    const chats = await Chat.find(query).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    console.error("Failed to fetch chats:", err);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: "Chat history is temporarily unavailable." });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid chat id" });
    }

    const chat = await Chat.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json(chat);
  } catch (err) {
    console.error("Failed to fetch chat:", err);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: "Chat history is temporarily unavailable." });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid chat id" });
    }

    const title = normalizeTitle(req.body?.title);
    const messages = req.body?.messages ? sanitizeMessages(req.body.messages) : null;
    const nextTitle = title || (messages ? createSuggestedChatTitle(messages) : "");
    const model = req.body?.model ? String(req.body.model).trim() : null;
    const riskLevel = req.body?.riskLevel ? String(req.body.riskLevel).trim() : null;

    if (req.body?.messages && messages.length === 0) {
      return res.status(400).json({ error: "A chat must contain at least one valid message." });
    }

    const updatedChat = await Chat.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        $set: {
          ...(nextTitle ? { title: nextTitle } : {}),
          ...(messages ? { messages } : {}),
          ...(model ? { model } : {}),
          ...(riskLevel ? { riskLevel } : {}),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedChat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json(updatedChat);
  } catch (err) {
    console.error("Failed to update chat:", err);
    res.status(500).json({ error: "Failed to update chat" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: "Chat history is temporarily unavailable." });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid chat id" });
    }

    const deletedChat = await Chat.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deletedChat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ message: "Chat deleted" });
  } catch (err) {
    console.error("Failed to delete chat:", err);
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

export default router;
