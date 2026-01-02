import express from "express";
import KitchenNote from "../models/KitchenNote.js";

const router = express.Router();

// GET all notes
router.get("/", async (req, res) => {
  const notes = await KitchenNote.find().sort({ createdAt: 1 });
  res.json(notes);
});

// CREATE note
router.post("/", async (req, res) => {
  const note = await KitchenNote.create({
    label: req.body.label,
    category:req.body.category
  });
  res.json(note);
});

// UPDATE note
router.put("/:id", async (req, res) => {
  await KitchenNote.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
});

export default router;
