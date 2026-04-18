import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: "",
    trim: true,
    maxlength: 240,
  },
  age: {
    type: Number,
    min: 0,
    max: 120,
    default: null,
  },
  phone: {
    type: String,
    default: "",
    trim: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: true,
  },
  emailVerificationTokenHash: {
    type: String,
    default: null,
  },
  emailVerificationExpires: {
    type: Date,
    default: null,
  },
  resetPasswordTokenHash: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  authProvider: {
    type: String,
    default: "local",
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", function updateTimestamp() {
  this.updatedAt = new Date();
});

const User = mongoose.model("User", userSchema);

export default User;
