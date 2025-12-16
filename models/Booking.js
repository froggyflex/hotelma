import mongoose from "mongoose";


const BookingSchema = new mongoose.Schema({
  guestName: { type: String, required: true },
  room: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  adults: { type: Number, default: null },
  kids: { type: Number, default: null },
  channel: { type: String, default: "Direct" },
  totalAmount: { type: Number, default:0 }, // packet holiday total
  deposit: { type: Number, default: 0 },         // upfront payment
  price: { type: Number, default: 0 },
  notes: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Booking", BookingSchema);
