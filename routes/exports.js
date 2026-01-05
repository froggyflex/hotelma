import express from "express";
import {exportBookingsCSV, exportBookingsPDF} from "../controllers/exportController.js";

const router = express.Router();

router.post("/bookings/csv", exportBookingsCSV);
router.post("/bookings/pdf", exportBookingsPDF);

export default router;
