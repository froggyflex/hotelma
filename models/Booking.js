import mongoose from "mongoose";


const BookingSchema = new mongoose.Schema({
  guestName: { type: String, required: true },
  room: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  adults: { type: Number, default: 2 },
  kids: { type: Number, default: 0 },
  channel: { type: String, default: "Direct" },
  price: { type: Number, default: 0 },
  notes: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Booking", BookingSchema);
