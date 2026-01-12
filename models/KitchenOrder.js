import mongoose from "mongoose";

const KitchenOrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KitchenProduct",
      required: true,
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

     
    printed: {
      type: Boolean,
      default: false,
    },

    printedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true, timestamps: false }
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

KitchenOrderItemSchema.pre("save", function () {
  if (
    (this.status === "sent" || this.status === "delivered") &&
    this.printed !== true
  ) {
    throw new Error(
      "Illegal state: item cannot be sent/delivered without printing"
    );
  }
});
KitchenOrderItemSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  const status =
    update?.status ??
    update?.$set?.status;

  const printed =
    update?.printed ??
    update?.$set?.printed;

  if (
    (status === "sent" || status === "delivered") &&
    printed !== true
  ) {
    throw new Error(
      "Illegal state transition in update"
    );
  }
});


export default mongoose.model("KitchenOrder", KitchenOrderSchema);
