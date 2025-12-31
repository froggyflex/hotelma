import express from "express";
import KitchenProduct from "../models/KitchenProduct.js";

const router = express.Router();

// GET products
router.get("/", async (req, res) => {
  const products = await KitchenProduct.find()
    .populate("noteTemplateIds")
    .sort({ sortOrder: 1 });

  res.json(products);
});

// CREATE product
router.post("/", async (req, res) => {
  const product = await KitchenProduct.create(req.body);
  res.json(product);
});

// BULK CREATE PRODUCTS
router.post("/bulk", async (req, res) => {
  try {
    const { category, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    const docs = items
      .map(name => name.trim())
      .filter(Boolean)
      .map(name => ({
        name,
        category,
        active: true,
        allowCustomNote: true,
      }));

    const created = await KitchenProduct.insertMany(docs);

    res.json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bulk insert failed" });
  }
});

// UPDATE product
router.put("/:id", async (req, res) => {
  await KitchenProduct.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
});

export default router;
