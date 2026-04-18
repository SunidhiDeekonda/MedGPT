export const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  bio: user.bio || "",
  age: typeof user.age === "number" ? user.age : null,
  phone: user.phone || "",
  isEmailVerified: Boolean(user.isEmailVerified),
  authProvider: user.authProvider || "local",
});
