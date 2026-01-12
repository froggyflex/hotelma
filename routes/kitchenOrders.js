import express from "express";
import KitchenOrder from "../models/KitchenOrder.js";

const router = express.Router();

/**
 * GET ACTIVE ORDER BY TABLE
 */
router.get("/active/:tableId", async (req, res) => {
  try {
    const order = await KitchenOrder.findOne({
      "table.id": req.params.tableId,
      status: "active",
    }).sort({ createdAt: -1 });

    res.json(order || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch active order" });
  }
});

/**
 * CREATE NEW ORDER
 */
router.post("/", async (req, res) => {
  try {
    const { table, items, orderName } = req.body;

    if (!table?.id || !items?.length) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const order = new KitchenOrder({
      table: {
        id: table.id,
        name: table.name,
      },
      orderName: orderName || "",
      status: "active",
      items: items.map(i => ({
        productId: i.productId,
        name: i.name,
        qty: i.qty ?? 1,
        notes: i.notes ?? [],
        customNote: i.customNote ?? "",
        status: "new",
      })),
    });

    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/active", async (req, res) => {
  try {
    const orders = await KitchenOrder.find(
      { status: "active" },
      { "table.id": 1 }
    );

    const openTableIds = orders.map(o => o.table.id);
    res.json(openTableIds);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch open tables" });
  }
});


/**
 * APPEND ITEMS TO EXISTING ORDER
 */
router.post("/:orderId/items", async (req, res) => {
  try {
    const { items } = req.body;
    const order = await KitchenOrder.findById(req.params.orderId);

    if (!order || order.status !== "active") {
      return res.sendStatus(404);
    }

    items.forEach(i => {
      order.items.push({
        productId: i.productId,
        name: i.name,
        qty: i.qty ?? 1,
        notes: i.notes ?? [],
        customNote: i.customNote ?? "",
        status: "new",
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
 * MARK NEW ITEMS AS SENT (AFTER PRINT SUCCESS)
 */
router.post("/:orderId/print", async (req, res) => {
  try {
    const order = await KitchenOrder.findById(req.params.orderId);

    if (!order || order.status !== "active") {
      return res.sendStatus(404);
    }

    let changed = false;

    order.items.forEach(item => {
      if (item.status === "new") {
        item.status = "sent";
        item.printedAt = new Date();
        changed = true;
      }
    });

    if (changed) {
      await order.save();
    }

    res.json(order);
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
      status: "active",
    });

    if (!order) return res.sendStatus(404);

    const item = order.items.id(req.params.itemId);
    item.status = "delivered";

    await order.save();
    res.json(order); // ✅ RETURN UPDATED ORDER
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

/**
 * CLOSE ORDER
 */
router.post("/:orderId/close", async (req, res) => {
  try {
    const order = await KitchenOrder.findById(req.params.orderId);
    if (!order) return res.sendStatus(404);

    order.status = "closed";
    await order.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

/**
 * UPDATE ORDER NAME
 */
router.patch("/:id/name", async (req, res) => {
  try {
    const { orderName } = req.body;

    const order = await KitchenOrder.findByIdAndUpdate(
      req.params.id,
      { orderName },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order name" });
  }
});

export default router;
