import crypto from "crypto";

export const createRawToken = () => crypto.randomBytes(24).toString("hex");

export const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token || "")).digest("hex");

export const createExpiringTokenRecord = (durationMs = 1000 * 60 * 30) => {
  const token = createRawToken();

  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + durationMs),
  };
};
