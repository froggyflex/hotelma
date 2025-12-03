// backend/routes/invoices.js
// ------------------------------------------------------------
// FULL AADE INVOICE HANDLER (local JSON storage + AADE submit)
// ------------------------------------------------------------

import express from "express";
import fs from "fs";
import path from "path";
import axios from "axios";
import buildMyDataXML from "../utils/xmlBuilder.js";
import Invoice from "../models/Invoice.js";
const router = express.Router();

// ------------------------------------------------------------
// FILE PATHS
// ------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
 
// Ensure data/ exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

 
 function loadJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
 

function loadSettings() {
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
}
// Helper to save JSON
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function nextAA() {
// Load settings & invoice DB
    const settings = loadJSON(SETTINGS_FILE, null);
  
    if (!settings) return res.status(500).json({ error: "SETTINGS_NOT_FOUND" });

    console.log(settings) 
    // Auto AA / series
    const seriesCfg = settings.invoiceSeries;

      const assignedAA = seriesCfg.nextAA;
      const assignedSeries = seriesCfg.currentSeries;

      // increment next AA
      seriesCfg.nextAA += 1;

      // rotate if overflow
      if (seriesCfg.nextAA > seriesCfg.maxAA) {
        const idx = seriesCfg.allowedSeries.indexOf(assignedSeries);
        const nextIdx = (idx + 1) % seriesCfg.allowedSeries.length;

        seriesCfg.current = seriesCfg.allowedSeries[nextIdx];
        seriesCfg.nextAA = 1;
      }

    // Save updated settings
    saveJSON(SETTINGS_FILE, settings);
    return { aa: assignedAA, series: assignedSeries };
}

  function parseAadeResponse(raw) {
  if (raw != null){

  // raw.aadeResponse is the <string> ... </string> containing XML
  const xmlString = raw;

  // Decode &lt; &gt; etc.
  const decoded = xmlString
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

  const getTag = (tag) => {
    const regex = new RegExp(`<${tag}>([^<]*)<\\/${tag}>`);
    const match = decoded.match(regex);
    return match ? match[1] : null;
  };

  return {
    statusCode: getTag("statusCode"),
    invoiceMark: getTag("invoiceMark"),
    invoiceUid: getTag("invoiceUid"),
    authenticationCode: getTag("authenticationCode"),
    qrUrl: getTag("qrUrl"),
    raw: decoded,
  };
}
 return null;
  } 
 
// GET /api/invoices/list   (MongoDB)
// ---------------------------------------------
router.get("/list", async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 }).lean();

    // make id flat
    const result = invoices.map(inv => ({
      ...inv,
      id: inv._id.toString(),
      _id: undefined,
    }));

    res.json({ invoices: result });
  } catch (err) {
    console.error("ERROR /list:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});
 

// ------------------------------------------------------
// POST /api/invoices/submit → SEND TO AADE + save to DB
// ------------------------------------------------------
router.post("/submit", async (req, res) => {
  try {
    const settings = loadSettings();
    const { aa, series } = nextAA();

    // Build Payload
    const payload = {
      ...req.body,
      aa,
      invoiceHeader: {
        ...(req.body.invoiceHeader || {}),
        aa,
        series,
        issueDate:
          req.body.invoiceHeader?.issueDate ||
          new Date().toISOString().slice(0, 10),
      },
    };

    // Build XML
    const xml = buildMyDataXML(payload, settings);

    // Submit to AADE
    const url = process.env.MYDATA_DEV_SEND;

    const aadeResponse = await axios.post(url, xml, {
      headers: {
        "Content-Type": "application/xml; charset=UTF-8",
        "Ocp-Apim-Subscription-Key": settings.aade.subscriptionKey,
        "aade-user-id": settings.aade.username,
        Accept: "application/xml",
      },
      transformRequest: [(data) => data],
      validateStatus: () => true,
    });

    const rawXmlResponse = aadeResponse.data;
    const parsed = parseAadeResponse(rawXmlResponse);
    const mark = parsed?.invoiceMark || null;

    // Save to MongoDB
    const newInvoice = await Invoice.create({
      payload,
      aa,
      series,
      xmlSent: xml,
      aadeRawResponse: rawXmlResponse,
      mark,
      dateSubmitted: new Date(),
      status: mark ? "submitted" : "error",
    });
    console.log(newInvoice);
    // Respond to frontend
    res.json({
      success: true,
      aa,
      series,
      mark,
      xmlSent: xml,
      aadeResponse: rawXmlResponse,
      id: newInvoice._id.toString(),
    });

  } catch (err) {
    console.error("FATAL SUBMIT ERROR:", err);
    res.status(500).json({
      success: false,
      error: "AADE_SUBMISSION_ERROR",
      details: err.message,
    });
  }
});

// ------------------------------------------------------------
export default router;
