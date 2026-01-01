import mongoose from "mongoose";

const TablePositionSchema = new mongoose.Schema({
  tableId: { type: String, required: true },
  x: Number,
  y: Number,
});

const TableMapSchema = new mongoose.Schema(
  {
    area: { type: String, default: "main" },
    width: { type: Number, default: 1000 },
    height: { type: Number, default: 600 },
    tables: [TablePositionSchema],
    doors: { type: Array, default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("TableMap", TableMapSchema);
