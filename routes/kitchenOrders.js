import express from "express";
import KitchenOrder from "../models/KitchenOrder.js";
 

const router = express.Router();

/**
 * CREATE ORDER
 */
router.post("/", async (req, res) => {
  try {
    const { table, tableNote, items } = req.body;

    if (!table?.id || !table?.name || !items?.length) {
      return res.status(400).json({ error: "Invalid order payload" });
    }

    const order = await KitchenOrder.create({
      table,
      tableNote,
      items,
    });

    res.json(order);
  } catch (err) {
    console.error("Create order failed:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

/**
 * GET OPEN ORDERS (optionally by table)
 */
router.get("/", async (req, res) => {
  try {
    const { tableId } = req.query;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const filter = {
      createdAt: { $gte: since },
    };

    if (tableId) {
      filter["table.id"] = tableId;
    }

    const orders = await KitchenOrder.find(filter).sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (err) {
    console.error("Fetch orders failed:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});


/**
 * CLOSE ORDER (later used when table is settled)
 */
router.patch("/:id/close", async (req, res) => {
  try {
    const order = await KitchenOrder.findByIdAndUpdate(
      req.params.id,
      { status: "closed" },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    console.error("Close order failed:", err);
    res.status(500).json({ error: "Failed to close order" });
  }
});

router.patch("/:id/print-status", async (req, res) => {
  try {
    const { success, error } = req.body;

    const update = success
      ? {
          status: "printed",
          printedAt: new Date(),
          printError: null,
        }
      : {
          status: "failed",
          printError: error || "Unknown print error",
        };

    const order = await KitchenOrder.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    res.json(order);
  } catch (err) {
    console.error("Update print status failed", err);
    res.status(500).json({ error: "Failed to update print status" });
  }
});

export default router;
