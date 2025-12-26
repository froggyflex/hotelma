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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
app.use(cors())
app.use(express.json())

const DB_PATH = path.join(__dirname, 'data', 'db.json')

connectDB(); // <-- start connection

import statusRoutes from "./routes/aadeStatus.js";
app.use("/api/aade", statusRoutes);

       
// --- IARP ---
app.use("/api/invoices", invoiceRoutes);
app.use("/api/settings", settingsRoutes);
 
// --- ROOMS ---



app.post("/register-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!req.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    await User.findByIdAndUpdate(
      req.user.email,
      { $addToSet: { fcmTokens: token } },
      { new: true }
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

app.get('/bookings', async (req, res)  =>{

  try {
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
    const booking = await Booking.create(req.body);

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
    await Booking.findByIdAndUpdate(req.params.id, req.body);

    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to update booking:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE booking
app.delete("/bookings/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);

    res.json({ ok: true });
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

app.post("/api/notifications/test", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  try {
    await admin.messaging().send({
      token,
      notification: {
        title: "🏨 Luis Pool – Test",
        body: "Notifications are working correctly 🎉",
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});
