import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const settingsPath = path.join(__dirname, "../data/settings.json");

// GET settings
router.get("/", (req, res) => {
  try {
    const raw = fs.readFileSync(settingsPath, "utf8");
    const data = JSON.parse(raw);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "SETTINGS_READ_ERROR", details: err.message });
  }
});

// UPDATE settings
router.post("/", (req, res) => {
  try {
    const updated = req.body;
    fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2));
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: "SETTINGS_WRITE_ERROR", details: err.message });
  }
}); 

export default router;
