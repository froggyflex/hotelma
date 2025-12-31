import mongoose from "mongoose";

const KitchenNoteSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("KitchenNote", KitchenNoteSchema);