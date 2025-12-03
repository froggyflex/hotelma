import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
  // AADE core
  aa: Number,
  series: String,
  mark: { type: String, default: null },
  dateSubmitted: Date,

  // Full AADE payload (kept raw for easy resubmission)
  payload: {
    type: Object,
    required: true
  },

  // Raw XML + AADE response for audits
  xmlSent: String,
  aadeRawResponse: String,

  // Status control (very useful)
  status: {
    type: String,
    enum: ["draft", "submitted", "error"],
    default: "draft"
  }
}, { timestamps: true });

export default mongoose.model("Invoice", InvoiceSchema);
