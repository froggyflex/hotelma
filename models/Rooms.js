import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    name: String,
    type: String,
    capacity: Number,
    status: String,
    number: String,
    status: { type: String, default: "free" },
    notes: String
});

export default mongoose.model("Room", RoomSchema);
