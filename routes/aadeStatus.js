 
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const settingsPath = path.join(__dirname, "../data/settings.json");

function loadSettings() {
  return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
}

router.get("/status/:mark", async (req, res) => {
  try {
    const mark = req.params.mark;
    const s = loadSettings();

    const url = s.aade.mode === "DEV"
      ? process.env.MYDATA_DEV_STATUS
      : "https://mydatapi.aade.gr/myDATA/RequestTransmittedDocs";

    const xml = `
      <ReqTransDoc xmlns="http://www.aade.gr/myDATA/invoice/v1.0">
        <mark>${mark}</mark>
      </ReqTransDoc>
    `.trim();

    const response = await axios.post(url, xml, {
      headers: {
        "Content-Type": "application/xml",
        "Ocp-Apim-Subscription-Key": s.aade.subscriptionKey,
        "aade-user-id": s.aade.username
      }
    });

    res.json({
      success: true,
      aadeStatus: response.data
    });

  } catch (err) {
    res.status(500).json({
      error: "AADE_STATUS_ERROR",
      details: err.response?.data || err.message
    });
  }
});

export default router;
