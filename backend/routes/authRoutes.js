import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getJwtSecret } from "../config/auth.js";
import { isDatabaseConnected } from "../config/db.js";
import { buildFrontendUrl } from "../utils/appLinks.js";
import { createExpiringTokenRecord, hashToken } from "../utils/tokens.js";
import { serializeUser } from "../utils/userResponses.js";
import { isValidObjectId, normalizeEmail, normalizeName } from "../utils/validation.js";

const router = express.Router();

const signUserToken = (user) =>
  jwt.sign({ id: user._id.toString(), authType: "jwt" }, getJwtSecret(), {
    expiresIn: "7d",
  });

const buildDevLinkPayload = (type, token) => {
  if (!token) {
    return {};
  }

  const route =
    type === "reset"
      ? `/reset-password?token=${token}`
      : `/verify-email?token=${token}`;

  return {
    devOnlyLink: buildFrontendUrl(route),
  };
};

router.post("/signup", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ message: "Database is unavailable. Please try again in a moment." });
    }

    const name = normalizeName(req.body?.name);
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "This email is already registered. Please log in instead." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = createExpiringTokenRecord(1000 * 60 * 60 * 24);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationTokenHash: verificationToken.tokenHash,
      emailVerificationExpires: verificationToken.expiresAt,
    });

    await newUser.save();

    res.status(201).json({
      message: "Account created successfully. Please verify your email, then log in.",
      user: serializeUser(newUser),
      ...buildDevLinkPayload("verify", verificationToken.token),
    });
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({ message: "Signup failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ message: "Database is unavailable. Please try again in a moment." });
    }

    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter both email and password." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "No account found with this email. Please create an account first." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password. Please try again." });
    }

    const token = signUserToken(user);

    res.json({
      message: "Login successful",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ message: "Database is unavailable. Please try again in a moment." });
    }

    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ message: "Please enter your email address." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        message: "If an account exists for that email, a reset link has been prepared.",
      });
    }

    const resetToken = createExpiringTokenRecord(1000 * 60 * 30);
    user.resetPasswordTokenHash = resetToken.tokenHash;
    user.resetPasswordExpires = resetToken.expiresAt;
    await user.save();

    res.json({
      message: "Password reset instructions are ready.",
      ...buildDevLinkPayload("reset", resetToken.token),
    });
  } catch (error) {
    console.error("Forgot password failed:", error);
    res.status(500).json({ message: "Unable to start password reset right now." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ message: "Database is unavailable. Please try again in a moment." });
    }

    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");

    if (!token || !password) {
      return res.status(400).json({ message: "Reset token and new password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const user = await User.findOne({
      resetPasswordTokenHash: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password reset successful. You can log in now." });
  } catch (error) {
    console.error("Reset password failed:", error);
    res.status(500).json({ message: "Unable to reset password right now." });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ message: "Database is unavailable. Please try again in a moment." });
    }

    const token = String(req.body?.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Verification token is required." });
    }

    const user = await User.findOne({
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "This verification link is invalid or has expired." });
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({ message: "Email verified successfully. You can continue using your account." });
  } catch (error) {
    console.error("Email verification failed:", error);
    res.status(500).json({ message: "Unable to verify email right now." });
  }
});

router.use(authMiddleware);

router.get("/me", async (req, res) => {
  try {
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Profile editing is only available for email/password accounts." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user: serializeUser(user) });
  } catch (error) {
    console.error("Fetch profile failed:", error);
    res.status(500).json({ message: "Unable to load profile right now." });
  }
});

router.patch("/me", async (req, res) => {
  try {
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Profile editing is only available for email/password accounts." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const nextName = normalizeName(req.body?.name);
    const nextBio = String(req.body?.bio || "").trim().slice(0, 240);
    const nextPhone = String(req.body?.phone || "").trim().slice(0, 24);
    const rawAge = req.body?.age;
    const nextAge =
      rawAge === "" || rawAge === null || rawAge === undefined
        ? null
        : Number(rawAge);

    if (!nextName) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (nextAge !== null && (Number.isNaN(nextAge) || nextAge < 0 || nextAge > 120)) {
      return res.status(400).json({ message: "Please enter a valid age." });
    }

    user.name = nextName;
    user.bio = nextBio;
    user.phone = nextPhone;
    user.age = nextAge;
    await user.save();

    res.json({
      message: "Profile updated successfully.",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Profile update failed:", error);
    res.status(500).json({ message: "Unable to update profile right now." });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Email verification is only available for email/password accounts." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isEmailVerified) {
      return res.json({ message: "Your email is already verified." });
    }

    const verificationToken = createExpiringTokenRecord(1000 * 60 * 60 * 24);
    user.emailVerificationTokenHash = verificationToken.tokenHash;
    user.emailVerificationExpires = verificationToken.expiresAt;
    await user.save();

    res.json({
      message: "A new verification link is ready.",
      ...buildDevLinkPayload("verify", verificationToken.token),
    });
  } catch (error) {
    console.error("Resend verification failed:", error);
    res.status(500).json({ message: "Unable to resend verification right now." });
  }
});

export default router;
