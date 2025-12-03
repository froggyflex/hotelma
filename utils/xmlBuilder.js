// xmlBuilder.js — MOST STRICT AADE-COMPLIANT VERSION (B2C + B2B)

function escapeXML(str = "") {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function splitAddress(addr) {
  if (!addr) return { street: "", number: "0" };
  const parts = addr.trim().split(" ");
  const last = parts.pop();
  if (isNaN(Number(last))) return { street: addr, number: "0" };
  return { street: parts.join(" "), number: last };
}

export default function buildMyDataXML(payload, settings) {
  const hotel = settings.hotelInfo;
  const invoiceHeader = payload.invoiceHeader;
  const customer = payload.customer;
  const invoiceDetails = payload.invoiceDetails;
  const bookingInfo = payload.bookingInfo;

  // console.log(payload, 'payload');
 

  const paymentMethods = Array.isArray(payload.paymentMethods)
  ? payload.paymentMethods.map(pm => ({
      type: pm.type,
      amount: Number(pm.amount)
    }))
  : [];

  function getVatRate(cat) {
    switch (cat) {
      case 1: return 0.24;  // 24%
      case 2: return 0.13;  // 13%
      case 3: return 0.06;  // 6%
      case 7: return 0.00;  // exempt
      default: return 0.24;
    }
  }

  const invoiceType = invoiceHeader.invoiceType;

  const isB2C = invoiceType === "11.3";
  const isB2B = !isB2C;
  let classificationType = null;
  let classificationCategory =  null;
  // ------------------------------
  // ISSUER (GR → only minimal allowed)
  // ------------------------------
  const issuerXML = `
    <issuer>
      <vatNumber>${hotel.vatNumber}</vatNumber>
      <country>GR</country>
      <branch>0</branch>
    </issuer>
  `;

  // ------------------------------
  // COUNTERPART (rules depend on invoice type)
  // ------------------------------
  let counterpartXML = "";

  if (isB2B) {
    const cAddr = splitAddress(customer.address);

    counterpartXML = `
      <counterpart>
        <vatNumber>${escapeXML(customer.vatNumber)}</vatNumber>
        <country>${escapeXML(customer.country || "GR")}</country>
        <branch>0</branch>
        <address>
          <street>${escapeXML(cAddr.street)}</street>
          <number>${escapeXML(cAddr.number)}</number>
          <postalCode>${escapeXML(customer.postalCode || "")}</postalCode>
          <city>${escapeXML(customer.city || "")}</city>
        </address>
      </counterpart>
    `;
  }

  // ------------------------------
  // Booking → put inside lineComments
  // ------------------------------
  if (bookingInfo && invoiceDetails.length > 0) {
    const arr = [];
    if (bookingInfo.room) arr.push(`Room ${bookingInfo.room}`);
    if (bookingInfo.checkIn) arr.push(`Check-in ${bookingInfo.checkIn}`);
    if (bookingInfo.checkOut) arr.push(`Check-out ${bookingInfo.checkOut}`);
    if (bookingInfo.notes) arr.push(`Notes: ${bookingInfo.notes}`);
    invoiceDetails[0].lineComments = arr.join(" | ");
  }

  // ------------------------------
  // DETAILS
  // ------------------------------

  const detailsXML = invoiceDetails
    .map((line) => {
      const exempt = line.vatCategory === 7;
      classificationType = line.classificationType || "E3_561_001";
      classificationCategory = line.classificationCategory || "category1_1";  

      return `
        <invoiceDetails>
          <lineNumber>${line.lineNumber}</lineNumber>
          <netValue>${line.netValue.toFixed(2)}</netValue>

          <vatCategory>${line.vatCategory}</vatCategory>
          <vatAmount>${(line.netValue * getVatRate(line.vatCategory)).toFixed(2)}</vatAmount>

          ${exempt ? `<vatExemptionCategory>1</vatExemptionCategory>` : ""}

          ${
            line.lineComments
              ? `<lineComments>${escapeXML(line.lineComments)}</lineComments>`
              : ""
          }

          <incomeClassification>
            <classificationType xmlns="https://www.aade.gr/myDATA/incomeClassificaton/v1.0">${classificationType}</classificationType>
            <classificationCategory xmlns="https://www.aade.gr/myDATA/incomeClassificaton/v1.0">${classificationCategory}</classificationCategory>
            <amount xmlns="https://www.aade.gr/myDATA/incomeClassificaton/v1.0">
              ${line.netValue.toFixed(2)}
            </amount>
          </incomeClassification>
        </invoiceDetails>
      `;
    })
    .join("");

  // ------------------------------
  // PAYMENT METHODS (must appear BEFORE details)
  // ------------------------------
   // Payments
    let paymentsXML = "";
    const totalNet = invoiceDetails.reduce((a, l) => a + l.netValue, 0);
    const totalVat = invoiceDetails.reduce((a, l) => a + l.vatAmount, 0);
 
      // B2B must ALWAYS have paymentMethods
      if (isB2B) {
        if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
          throw new Error("B2B invoice requires payment methods.");
        }

        paymentsXML = `
          <paymentMethods>
            ${paymentMethods
              .map(
                pm => `
              <paymentMethodDetails>
                <type>${pm.type}</type>
                <amount>${pm.amount.toFixed(2)}</amount>
              </paymentMethodDetails>
            `
              )
              .join("")}
          </paymentMethods>
        `;

      } else {
        // B2C case
        if (Array.isArray(paymentMethods) && paymentMethods.length > 0) {
          // Use the actual payments
          paymentsXML = `
            <paymentMethods>
              ${paymentMethods
                .map(
                  pm => `
                <paymentMethodDetails>
                  <type>${pm.type}</type>
                  <amount>${pm.amount.toFixed(2)}</amount>
                </paymentMethodDetails>
              `
                )
                .join("")}
            </paymentMethods>
          `;
        } else {
          // Auto-cash fallback for B2C only
          const totalGross = totalNet + totalVat;
          paymentsXML = `
            <paymentMethods>
              <paymentMethodDetails>
                <type>3</type>
                <amount>${totalGross.toFixed(2)}</amount>
              </paymentMethodDetails>
            </paymentMethods>
          `;
        }
      }

  // ------------------------------
  // SUMMARY
  // ------------------------------


  const totalGross = totalNet + totalVat;

  const summaryXML = `
    <invoiceSummary>
      <totalNetValue>${totalNet.toFixed(2)}</totalNetValue>
      <totalVatAmount>${totalVat.toFixed(2)}</totalVatAmount>
      <totalWithheldAmount>0.00</totalWithheldAmount>

      <totalFeesAmount>0.00</totalFeesAmount>
      <totalStampDutyAmount>0.00</totalStampDutyAmount>
      <totalOtherTaxesAmount>0.00</totalOtherTaxesAmount>
      <totalDeductionsAmount>0.00</totalDeductionsAmount>

      <totalGrossValue>${totalGross.toFixed(2)}</totalGrossValue>

      <incomeClassification>
        <classificationType xmlns="https://www.aade.gr/myDATA/incomeClassificaton/v1.0" >${classificationType}</classificationType>
        <classificationCategory xmlns="https://www.aade.gr/myDATA/incomeClassificaton/v1.0">${classificationCategory}</classificationCategory>
        <amount xmlns="https://www.aade.gr/myDATA/incomeClassificaton/v1.0">
          ${totalNet.toFixed(2)}
        </amount>
      </incomeClassification>
    </invoiceSummary>
  `;

  // ------------------------------
  // FINAL XML (correct AADE node order)
  // ------------------------------
  return `<?xml version="1.0" encoding="UTF-8"?>
<InvoicesDoc xmlns="http://www.aade.gr/myDATA/invoice/v1.0">

  <invoice>

    ${issuerXML}
    ${counterpartXML}

    <invoiceHeader>
      <series>${escapeXML(invoiceHeader.series)}</series>
      <aa>${Number(invoiceHeader.aa)}</aa>
      <issueDate>${invoiceHeader.issueDate}</issueDate>
      <invoiceType>${invoiceType}</invoiceType>
      <currency>EUR</currency>
    </invoiceHeader>

    ${paymentsXML}

    ${detailsXML}

    ${summaryXML}

  </invoice>

</InvoicesDoc>`;
}
