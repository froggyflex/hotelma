import express from "express";
import Room from "../models/Rooms.js";
import Booking from "../models/Booking.js";
import { add, parseISO, isWithinInterval } from "date-fns";

const router = express.Router();

// Helper: check if a room is free
function roomIsFree(room, start, end, bookings) {
  return !bookings.some(b => {
    if (b.room !== room.name) return false;

    const bStart = parseISO(b.checkIn);
    const bEnd = add(parseISO(b.checkOut), { days: -1 });

    return (
      isWithinInterval(bStart, { start, end }) ||
      isWithinInterval(bEnd, { start, end }) ||
      isWithinInterval(start, { start: bStart, end: bEnd })
    );
  });
}

router.get("/", async (req, res) => {
  try {
    const { start, end, adults = 1, kids = 0 } = req.query;

    const startDate = parseISO(start);
    const endDate = add(parseISO(end), { days: -1 });
    const people = Number(adults) + Number(kids);

    const rooms = await Room.find();
    const bookings = await Booking.find();

    // Step 1: find all rooms free for the range
    const freeRooms = rooms.filter(room =>
      room.capacity >= people &&
      roomIsFree(room, startDate, endDate, bookings)
    );

    // Step 2: group by room type
    const grouped = {};
    for (const r of freeRooms) {
      if (!grouped[r.type]) {
        grouped[r.type] = {
          type: r.type,
          capacity: r.capacity,
          rooms: []
        };
      }
      grouped[r.type].rooms.push(r.name);
    }

    res.json({
      start,
      end,
      adults,
      kids,
      options: Object.values(grouped)
    });

  } catch (err) {
    console.error("Availability error:", err);
    res.status(500).json({ error: "Failed to check availability" });
  }
});

export default router;
