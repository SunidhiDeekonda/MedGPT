const FALLBACK_JWT_SECRET = "mysecretkey123";

let warnedAboutJwtSecret = false;

export const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (!warnedAboutJwtSecret) {
    console.warn(
      "JWT_SECRET is not set. Falling back to a development-only secret."
    );
    warnedAboutJwtSecret = true;
  }

  return FALLBACK_JWT_SECRET;
};
