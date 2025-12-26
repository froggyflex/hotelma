import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.post("/register-token", async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id; // from auth middleware

  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  await User.findByIdAndUpdate(userId, {
    $addToSet: { fcmTokens: token }, // prevents duplicates
  });

  res.json({ success: true });
});

export default router;
