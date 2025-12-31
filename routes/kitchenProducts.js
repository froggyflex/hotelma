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

// UPDATE product
router.put("/:id", async (req, res) => {
  await KitchenProduct.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
});

export default router;
