const defaultFrontendUrl = "http://localhost:3000";

export const getFrontendBaseUrl = () =>
  (process.env.FRONTEND_URL || defaultFrontendUrl).replace(/\/$/, "");

export const buildFrontendUrl = (path) =>
  `${getFrontendBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
