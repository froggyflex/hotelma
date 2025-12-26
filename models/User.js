import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: String,
  role: { type: String, default: "admin" },

  fcmTokens: {
    type: [String],
    default: [],
  },
});

export default mongoose.model("User", UserSchema);
