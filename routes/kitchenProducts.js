import express from "express";
import KitchenProduct from "../models/KitchenProduct.js";

const router = express.Router();

// GET products
router.get("/", async (req, res) => {
  const products = await KitchenProduct.find()
    .populate("noteTemplateIds", "label");

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

 

// UPDATE PRODUCT MODIFIERS (NOTES)
router.put("/:id/notes", async (req, res) => {
  try {
    const { noteTemplateIds } = req.body;

    if (!Array.isArray(noteTemplateIds)) {
      return res.status(400).json({ error: "noteTemplateIds must be an array" });
    }

    const updated = await KitchenProduct.findByIdAndUpdate(
      req.params.id,
      { noteTemplateIds },
      { new: true }
    ).populate("noteTemplateIds", "label");

    if (!updated) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Update product notes failed:", err);
    res.status(500).json({ error: "Failed to update product notes" });
  }
});

// BULK APPLY MODIFIERS TO CATEGORY
router.put("/bulk/apply-notes", async (req, res) => {
  try {
    const { category, noteTemplateIds, mode } = req.body;

    if (!category || !Array.isArray(noteTemplateIds)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const products = await KitchenProduct.find({ category });

    for (const product of products) {
      let updatedNotes;

      if (mode === "replace") {
        updatedNotes = noteTemplateIds;
      } else {
        const existing = product.noteTemplateIds.map(id => id.toString());
        updatedNotes = Array.from(
          new Set([...existing, ...noteTemplateIds])
        );
      }

      product.noteTemplateIds = updatedNotes;
      await product.save();
    }

    res.json({ success: true, updatedCount: products.length });
  } catch (err) {
    console.error("Bulk apply modifiers failed:", err);
    res.status(500).json({ error: "Bulk update failed" });
  }
});


export default router;
