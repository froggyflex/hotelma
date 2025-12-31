import mongoose from "mongoose";

const KitchenProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "General",
    },
    active: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    noteTemplateIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "KitchenNote",
      },
    ],
    allowCustomNote: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("KitchenProduct", KitchenProductSchema);
