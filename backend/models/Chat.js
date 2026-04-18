import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    trim: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
});

const chatSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: "New chat",
    trim: true,
  },
  model: {
    type: String,
    default: "llama-3.3-70b-versatile",
    trim: true,
  },
  riskLevel: {
    type: String,
    default: "Unknown",
    trim: true,
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

chatSchema.pre("save", function updateTimestamp() {
  this.updatedAt = new Date();
});

export default mongoose.model("Chat", chatSchema);
