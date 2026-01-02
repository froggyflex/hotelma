import mongoose from "mongoose";

const KitchenOrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },

    name: {
      type: String,
      required: true,
    },

    qty: {
      type: Number,
      default: 1,
      min: 1,
    },

    notes: {
      type: [String],
      default: [],
    },

    customNote: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["new", "sent", "delivered"],
      default: "new",
    },

    printedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const KitchenOrderSchema = new mongoose.Schema(
  {
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Table",
      index: true,
    },

    tableName: {
      type: String,
      required: true,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    items: {
      type: [KitchenOrderItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

 
KitchenOrderSchema.index(
  { tableId: 1, closedAt: 1 },
  { unique: true, partialFilterExpression: { closedAt: null } }
);

export default mongoose.model("KitchenOrder", KitchenOrderSchema);
