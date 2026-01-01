import mongoose from "mongoose";

const KitchenOrderSchema = new mongoose.Schema(
  {
    table: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
    },

    tableNote: { type: String },

    status: {
    type: String,
    enum: ["pending", "printed", "failed", "closed"],
    default: "pending",
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        name: { type: String, required: true },
        notes: [String],
        customNote: String,
        qty: { type: Number, required: true, default: 1 },
      },
    ],

    printedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("KitchenOrder", KitchenOrderSchema);
