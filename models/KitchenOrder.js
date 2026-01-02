import mongoose from "mongoose";

const KitchenOrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KitchenProduct",
    },
    name: String,
    qty: {
      type: Number,
      default: 1,
    },
    notes: [String],
    customNote: String,
    status: {
      type: String,
      enum: ["sent", "delivered"],
      default: "sent",
    },
  },
  { _id: true }
);

const KitchenOrderSchema = new mongoose.Schema(
  {
    table: {
      id: {
        type: String,
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
      },
    },

    orderName: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },

    items: [KitchenOrderItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("KitchenOrder", KitchenOrderSchema);
