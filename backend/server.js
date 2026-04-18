import "./config/env.js";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { optionalClerkMiddleware } from "./config/clerk.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import chatHistoryRoutes from "./routes/chatHistoryRoutes.js";

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(optionalClerkMiddleware());
app.use(express.json());

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/history", chatHistoryRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("MedGPT Backend Running");
});

// Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
