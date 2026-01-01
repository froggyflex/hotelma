import express from "express";
import TableMap from "../models/TableMap.js";

const router = express.Router();

/** Get map */
router.get("/", async (req, res) => {
  const map = await TableMap.findOne({ area: "main" });
  res.json(map);
});

/** Save map */
router.post("/", async (req, res) => {
  const { tables, width, height, doors } = req.body;

  let map = await TableMap.findOne({ area: "main" });

  if (!map) {
    map = new TableMap({ tables, width, height, doors });
  } else {
    map.tables = tables;
    map.width = width;
    map.height = height;
    map.doors = doors;
  }

  await map.save();
  res.json(map);
});

export default router;
