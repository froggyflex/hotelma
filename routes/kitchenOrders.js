import express from "express";
import KitchenOrder from "../models/KitchenOrder.js";

const router = express.Router();

/**
 * CREATE OR APPEND ORDER
 * Used when waiter sends an order (first time or later)
 */

// GET ACTIVE ORDER BY TABLE
router.get("/active/:tableId", async (req, res) => {
  try {
    const order = await KitchenOrder.findOne({
      "table.id": req.params.tableId,
      status: "active",
    });

    res.json(order || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch active order" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { table, items } = req.body;

    if (!table?.id || !items?.length) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    let order = await KitchenOrder.findOne({
      tableId: table.id,
      closedAt: null,
    });

    if (!order) {
      order = new KitchenOrder({
        tableId: table.id,
        tableName: table.name,
        items: [],
      });
    }

    items.forEach(i => {
      order.items.push({
        productId: i.productId,
        name: i.name,
        qty: i.qty ?? 1,
        notes: i.notes ?? [],
        customNote: i.customNote ?? "",
      });
    });

    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

/**
 * GET ACTIVE ORDER FOR TABLE
 */
router.get("/table/:tableId", async (req, res) => {
  try {
    const order = await KitchenOrder.findOne({
      tableId: req.params.tableId,
      closedAt: null,
    });

    res.json(order || null);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

/**
 * ADD ITEMS TO EXISTING ORDER
 */
router.post("/:orderId/items", async (req, res) => {
  try {
    const { items } = req.body;
    const order = await KitchenOrder.findById(req.params.orderId);

    if (!order) return res.sendStatus(404);

    items.forEach(i => {
      order.items.push({
        productId: i.productId,
        name: i.name,
        qty: i.qty ?? 1,
        notes: i.notes ?? [],
        customNote: i.customNote ?? "",
      });
    });

    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

/**
 * MARK NEW ITEMS AS PRINTED (AFTER SUCCESSFUL PRINT)
 */
router.post("/:orderId/print", async (req, res) => {
  try {
    const order = await KitchenOrder.findById(req.params.orderId);
    if (!order) return res.sendStatus(404);

    order.items.forEach(item => {
      if (item.status === "new") {
        item.status = "sent";
        item.printedAt = new Date();
      }
    });

    await order.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

/**
 * MARK ITEM AS DELIVERED
 */
router.patch("/items/:itemId/delivered", async (req, res) => {
  try {
    const order = await KitchenOrder.findOne({
      "items._id": req.params.itemId,
    });

    if (!order) return res.sendStatus(404);

    const item = order.items.id(req.params.itemId);
    item.status = "delivered";

    await order.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

/**
 * CLOSE ORDER (TABLE LEAVES)
 */
router.post("/:orderId/close", async (req, res) => {
  try {
    const order = await KitchenOrder.findById(req.params.orderId);
    if (!order) return res.sendStatus(404);

    order.closedAt = new Date();
    await order.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});




export default router;
