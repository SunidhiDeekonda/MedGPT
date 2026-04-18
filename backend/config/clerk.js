import { clerkMiddleware } from "@clerk/express";

const hasClerkKeys = () =>
  Boolean(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY);

export const optionalClerkMiddleware = () => {
  if (!hasClerkKeys()) {
    return (req, res, next) => next();
  }

  return clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  });
};

export { hasClerkKeys };
