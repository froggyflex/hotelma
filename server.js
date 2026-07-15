import dotenv from "dotenv";

dotenv.config();
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import axios from "axios";
import fs from "fs";
import cors from "cors";
import invoiceRoutes from "./routes/invoices.js";
import { v4 as uuid } from "uuid";
import settingsRoutes from "./routes/settings.js";
import notificationRoutes from "./routes/notifications.js";
import User from "./models/User.js";

import { connectDB } from "./db.js";
import Booking from "./models/Booking.js";
import Room from "./models/Rooms.js";

import kitchenProductsRoutes from "./routes/kitchenProducts.js";
import kitchenNotesRoutes from "./routes/kitchenNotes.js";
import kitchenTablesRoutes from "./routes/kitchenTables.js";
import kitchenOrdersRoutes from "./routes/kitchenOrders.js";
import exportsRouter from "./routes/exports.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
app.use(cors())
app.use(express.json())

const DB_PATH = path.join(__dirname, 'data', 'db.json')
connectDB(); // <-- start connection

import statusRoutes from "./routes/aadeStatus.js";
app.use("/api/aade", statusRoutes);

//waiter mode API
app.use("/api/kitchen/orders", kitchenOrdersRoutes);


// Kitchen Admin API
app.use("/api/kitchen/products", requireAuth, kitchenProductsRoutes);
app.use("/api/kitchen/notes", requireAuth, kitchenNotesRoutes);
app.use("/api/kitchen/tables", requireAuth, kitchenTablesRoutes);

app.use("/api/exports", exportsRouter);
       
// --- IARP ---
app.use("/api/invoices", invoiceRoutes);
app.use("/api/settings", settingsRoutes);
 
// --- ROOMS ---

import tableMapRoutes from "./routes/tableMapRoutes.js";
app.use("/api/table-map", tableMapRoutes);

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = JSON.parse(auth.replace("Bearer ", ""));
    if (!user?.email) throw new Error();
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

app.post("/register-token", requireAuth, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    await User.updateOne(
      { email: req.user.email },           
      { $addToSet: { fcmTokens: token } },
      { upsert: true }

    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ register-token error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
 

// GET all rooms
app.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find().lean();

    const normalized = rooms.map(r => ({
      ...r,
      id: r._id.toString(),
      _id: undefined,
    }));

    res.json(normalized);
  } catch (err) {
    console.error("Failed to fetch rooms:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// CREATE room
app.post("/rooms", async (req, res) => {
  try {
    const room = await Room.create({
      name: req.body.name || "Room",
      type: req.body.type || "Double",
      capacity: typeof req.body.capacity === "number" ? req.body.capacity : 2,
      status: req.body.status || "clean",
    });
    
    console.log("POST /rooms BODY:", req.body); 
    res.json({
      ...room.toObject(),
      id: room._id.toString(),
      _id: undefined,
    });
  } catch (err) {
    console.error("Failed to create room:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE room
app.put("/rooms/:id", async (req, res) => {
  try {
    await Room.findByIdAndUpdate(req.params.id, req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to update room:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// DELETE room
app.delete("/rooms/:id", async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete room:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- BOOKINGS ---

const BOOKING_FIELDS = [
  "guestName", "room", "checkIn", "checkOut", "adults", "kids", "channel",
  "totalAmount", "deposit", "price", "paid", "notes"
];

function bookingPayload(body = {}) {
  return Object.fromEntries(
    BOOKING_FIELDS
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]])
  );
}

async function validateBooking(payload, excludeId) {
  const checkIn = String(payload.checkIn || "");
  const checkOut = String(payload.checkOut || "");
  const roomName = String(payload.room || "").trim();
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const isRealDate = (value) => {
    if (!datePattern.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };

  if (!String(payload.guestName || "").trim() || !roomName) {
    return { status: 400, error: "Guest name and room are required." };
  }
  if (!isRealDate(checkIn) || !isRealDate(checkOut) || checkOut <= checkIn) {
    return { status: 400, error: "Check-out must be after check-in." };
  }

  const room = await Room.findOne({ name: roomName }).lean();
  if (!room) return { status: 400, error: "The selected room does not exist." };

  const guests = Math.max(0, Number(payload.adults) || 0) + Math.max(0, Number(payload.kids) || 0);
  if (!Number.isFinite(Number(payload.adults)) || Number(payload.adults) < 1 || Number(payload.kids || 0) < 0) {
    return { status: 400, error: "A booking requires at least one adult and cannot have negative guest counts." };
  }
  if (guests > Number(room.capacity || 0)) {
    return {
      status: 409,
      error: `Room ${roomName} has capacity for ${room.capacity} guests, but this booking has ${guests}.`
    };
  }

  const conflictQuery = {
    room: roomName,
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (excludeId) conflictQuery._id = { $ne: excludeId };

  const conflict = await Booking.findOne(conflictQuery).lean();
  if (conflict) {
    return {
      status: 409,
      error: `Room ${roomName} is already booked from ${conflict.checkIn} to ${conflict.checkOut}.`,
      conflict: {
        id: conflict._id.toString(),
        guestName: conflict.guestName,
        checkIn: conflict.checkIn,
        checkOut: conflict.checkOut,
      }
    };
  }

  return null;
}

app.get('/bookings', async (req, res)  =>{

  try {
      // Booking timelines must never be served from a stale browser/proxy cache.
      res.set('Cache-Control', 'no-store');
      const bookings = await Booking.find().lean();

      // Convert _id to id to keep frontend compatibility
      const normalized = bookings.map(b => ({
        ...b,
        id: b._id.toString(),
        _id: undefined
      }));

      res.json(normalized);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      res.status(500).json({ error: "Server error" });
    }

})

// CREATE booking
app.post("/bookings", async (req, res) => {
  try {
    const payload = bookingPayload(req.body);
    const validationError = await validateBooking(payload);
    if (validationError) {
      return res.status(validationError.status).json(validationError);
    }

    const booking = await Booking.create(payload);

    res.json({
      ...booking.toObject(),
      id: booking._id.toString(),
      _id: undefined
    });
  } catch (err) {
    console.error("Failed to create booking:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE booking
app.put("/bookings/:id", async (req, res) => {
  try {
    const existing = await Booking.findById(req.params.id).lean();
    if (!existing) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const payload = { ...bookingPayload(existing), ...bookingPayload(req.body) };
    const validationError = await validateBooking(payload, req.params.id);
    if (validationError) {
      return res.status(validationError.status).json(validationError);
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    ).lean();

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({
      ...booking,
      id: booking._id.toString(),
      _id: undefined,
    });
  } catch (err) {
    console.error("Failed to update booking:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE booking
app.delete("/bookings/:id", async (req, res) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ ok: true, id: req.params.id });
  } catch (err) {
    console.error("Failed to delete booking:", err);
    res.status(500).json({ error: "Server error" });
  }
});

import availabilityRoutes from "./routes/availability.js";
app.use("/availability", availabilityRoutes);


const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));


import admin from "./firebaseAdmin.js";

 
