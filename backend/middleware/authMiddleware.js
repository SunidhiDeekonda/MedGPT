import { getAuth } from "@clerk/express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/auth.js";
import { hasClerkKeys } from "../config/clerk.js";

const authMiddleware = (req, res, next) => {
  try {
    if (hasClerkKeys()) {
      const auth = getAuth(req);

      if (auth.userId) {
        req.user = { id: auth.userId };
        return next();
      }
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Please log in to continue." });
    }

    const actualToken = authHeader.split(" ")[1];
    const decoded = jwt.verify(actualToken, getJwtSecret());

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Your session has expired. Please log in again." });
    }

    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authMiddleware;
