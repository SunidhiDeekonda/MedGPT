import "./env.js";
import mongoose from "mongoose";

mongoose.set("bufferCommands", false);

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI is not set. Database features will be unavailable.");
    return false;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB Connected:", conn.connection.host);
    return true;
  } catch (error) {
    console.error("Error connecting to DB:", error.message);
    console.warn("Continuing without database access. Auth history features may fail.");
    return false;
  }
};

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

export default connectDB;
