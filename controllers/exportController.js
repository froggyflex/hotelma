import Booking from "../models/Booking.js";
import PDFDocument from "pdfkit";
 
export async function exportBookingsCSV(req, res) {
  const { bookingIds } = req.body;

  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    return res.status(400).json({ message: "No booking IDs provided" });
  }

  const bookings = await Booking.find({
    _id: { $in: bookingIds }
  }).lean();

  const headers = [
    "Guest",
    "Room",
    "Check-in",
    "Check-out",
    "Adults",
    "Kids",
    "Total",
    "Deposit",
    "Paid",
    "Notes"
  ];

  const rows = bookings.map(b => [
    b.guestName,
    b.room,
    b.checkIn,
    b.checkOut,
    b.adults,
    b.kids,
    b.totalAmount,
    b.deposit,
    b.paid ? "Yes" : "No",
    (b.notes || "").replace(/\n/g, " ")
  ]);

  const csv = [
    headers.join(","),
    ...rows.map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    )
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=bookings.csv");
  res.send(csv);
}


export async function exportBookingsPDF(req, res) {
  const { bookingIds } = req.body;

  const bookings = await Booking.find({
    _id: { $in: bookingIds }
  }).lean();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=bookings.pdf");

  const doc = new PDFDocument({
    size: "A4",
    margin: 50
  });

  doc.pipe(res);

  bookings.forEach((b, index) => {
    if (index > 0) doc.addPage();

    /* HEADER */
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("LUIS POOL & FAMILY ", { align: "left" });

    doc
      .moveDown(0.3)
      .fontSize(12)
      .font("Helvetica")
      .text("Booking Summary");

    doc.moveDown(0.5);
    drawDivider(doc);

    /* GUEST INFO */
    sectionTitle(doc, "Guest Information");

    keyValue(doc, "Guest name", b.guestName);
    keyValue(doc, "Room", b.room);
    keyValue(
      doc,
      "Stay",
      `${formatDate(b.checkIn)} - ${formatDate(b.checkOut)}`
    );
    keyValue(
      doc,
      "Guests",
      `${b.adults} adult${b.adults !== 1 ? "s" : ""}, ${b.kids} kid${b.kids !== 1 ? "s" : ""}`
    );

    doc.moveDown();

    /* PAYMENT */
    sectionTitle(doc, "Payment Details");

    keyValue(doc, "Total amount", `€${b.totalAmount}`);
    keyValue(doc, "Deposit", `€${b.deposit || 0}`);
    keyValue(doc, "Paid", b.paid ? "Yes" : "No");

    /* NOTES */
    if (b.notes) {
      doc.moveDown();
      sectionTitle(doc, "Notes");
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(b.notes, {
          width: 450
        });
    }

    /* FOOTER */
    doc.moveDown(2);
    drawDivider(doc);

    doc
      .fontSize(8)
      .fillColor("gray")
      .text(
        `Generated on ${new Date().toLocaleDateString()}`,
        { align: "right" }
      );

    doc.fillColor("black");
  });

  doc.end();
}

/* ---------- helpers ---------- */

function sectionTitle(doc, title) {
  doc
    .moveDown()
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(title);
  doc.moveDown(0.3);
}

function keyValue(doc, key, value) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(`${key}: `, { continued: true });

  doc
    .font("Helvetica")
    .text(value ?? "-");
}

function drawDivider(doc) {
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor("#dddddd")
    .stroke();
  doc.moveDown();
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB");
}
