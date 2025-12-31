import express from "express";
import KitchenTable from "../models/KitchenTable.js";

const router = express.Router();

// GET tables
router.get("/", async (req, res) => {
  const tables = await KitchenTable.find().sort({ name: 1 });
  res.json(tables);
});

// CREATE table
router.post("/", async (req, res) => {
  const table = await KitchenTable.create({
    name: req.body.name,
  });
  res.json(table);
});

// UPDATE table
router.put("/:id", async (req, res) => {
  await KitchenTable.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
});

export default router;
