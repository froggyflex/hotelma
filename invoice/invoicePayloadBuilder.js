import { create } from "xmlbuilder2";
 
export function buildInvoiceXML({
  invoice,
  settings,
}) {
  
  
    /* -----------------------------------------------------
       CONSTRUCT XML ROOT
  ----------------------------------------------------- */
  const root = {
    InvoicesDoc: {
      "@xmlns": "http://www.aade.gr/myDATA/invoice/v1.0",
      "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      invoice: {}
    }
  };

   

  /* -----------------------------------------------------
       1. invoiceHeader
  ----------------------------------------------------- */
  function buildInvoiceHeader(settings, invoice) {
      return {
        invoiceHeader: {
          series: settings.series || "A",
          aa: invoice.aa, // auto-increment from settings.json
          issueDate:  new Date().toISOString().slice(0, 10),
          invoiceType: invoice.invoiceType, // 1.1 or 2.2 chosen by user
          currency: "EUR",

          // Required by schema v1.0.12
          vatPaymentSuspension: false,
          selfPricing: false,
          dispatchDate: new Date().toISOString().slice(0, 10),
          dispatchTime: "00:00:00",
          vehicleNumber: "",
          movePurpose: "",
          moveStartDate: "",
          moveEndDate: ""
        }
      };
  }


  /* -----------------------------------------------------
       2. issuer (hotel)
  ----------------------------------------------------- */

  function buildIssuer(settings) {
    return {
      issuer: {
        vatNumber: settings.hotelInfo.vatNumber,    // Your AFM
        country: "GR",
        branch: settings.hotel.branch || "0",  // 0 = main store by AADE rules

        // Required sub-block
        address: {
          street: settings.hotelInfo.address,
          number: settings.hotelInfo.number,
          postalCode: settings.hotelInfo.postalCode,
          city: settings.hotelInfo.city
        }
      }
    };
  }

  /* -----------------------------------------------------
       3. counterpart (customer)
  ----------------------------------------------------- */
function buildCounterpart(customer) {
  // If customer has a VAT number → treat as business invoice
  const isBusiness = customer.vatNumber && customer.vatNumber.trim() !== "";

  if (isBusiness) {
    // *** B2B CUSTOMER (BUSINESS) ***
    return {
      counterpart: {
        vatNumber: customer.vatNumber,
        country: customer.country || "GR",
        branch: customer.branch || "0",
        name: customer.name || "",
        
        address: {
          street: customer.address?.street || "",
          number: customer.address?.number || "",
          postalCode: customer.address?.postalCode || "",
          city: customer.address?.city || ""
        }
      }
    };
  }

  // *** B2C CUSTOMER (PRIVATE / TOURIST) ***
  return {
    counterpart: {
      // ID/passport number goes here
      idNumber: customer.idNumber || "UNKNOWN",

      country: customer.country || "GR",

      // Optional but recommended
      name: customer.name || "",
      address: {
        street: customer.address?.street || "",
        number: customer.address?.number || "",
        postalCode: customer.address?.postalCode || "",
        city: customer.address?.city || ""
      }
    }
  };
}
  /* -----------------------------------------------------
       4. paymentMethods
  ----------------------------------------------------- */
  inv.paymentMethods = {
    paymentMethodDetails: {
      type: "3", // 3 = cash, 1 = bank, 2 = credit card (change later)
      amount: n(totalGross)
    }
  };

  /* -----------------------------------------------------
       Prepare invoiceDetails(lines)
  ----------------------------------------------------- */
    function buildInvoiceDetails(settings, invoice) {
  let lineNumber = 1;
  const details = [];

  // ---------------------------------------------------
  // 1. ACCOMMODATION LINE (Main Hotel Service)
  // ---------------------------------------------------
  if (invoice.accommodation) {
    const nights = invoice.accommodation.nights || 1;
    const rate = invoice.accommodation.rate || 0;
    const netValue = nights * rate;
    const vatPercent = settings.invoice.vatMain;       // e.g. 13%
    const vatAmount = +(netValue * (vatPercent / 100)).toFixed(2);

    details.push({
      invoiceDetail: {
        lineNumber: lineNumber++,
        netValue,
        vatCategory: vatPercent === 13 ? 7 : 1, // 7 = 13% islands. 1 = 24%
        vatAmount,
        vatExemptionCategory: null,

        incomeClassification: {
          incomeClassificationDetail: {
            classificationType: 1,
            classificationCategory: "E3_561_003", // Accommodation
            amount: netValue
          }
        }
      }
    });
  }

  // ---------------------------------------------------
  // 2. TOURISM TAX LINE
  // ---------------------------------------------------
  if (settings.invoice.tourismTax > 0) {
    const tax = settings.invoice.tourismTax;

    details.push({
      invoiceDetail: {
        lineNumber: lineNumber++,
        netValue: tax,
        vatCategory: 0,
        vatAmount: 0,
        vatExemptionCategory: 5, // Correct exemption for residence charge

        incomeClassification: {
          incomeClassificationDetail: {
            classificationType: 1,
            classificationCategory: "E3_561_003",
            amount: tax
          }
        }
      }
    });
  }

  // ---------------------------------------------------
  // 3. EXTRA SERVICES (Bar / Food / Drinks / Other)
  // ---------------------------------------------------
  if (Array.isArray(invoice.extras)) {
    invoice.extras.forEach((item) => {
      const netValue = item.net;
      const vatPercent = item.vatPercent; // 13 or 24
      const vatAmount = +(netValue * (vatPercent / 100)).toFixed(2);

      // Decide classification
      let classCategory = "E3_561_001"; // default food
      if (item.type === "drink") classCategory = "E3_561_002";
      if (item.type === "service") classCategory = item.classificationCode || "E3_561_003";

      details.push({
        invoiceDetail: {
          lineNumber: lineNumber++,
          netValue,
          vatCategory: vatPercent === 13 ? 7 : 1,
          vatAmount,

          incomeClassification: {
            incomeClassificationDetail: {
              classificationType: 1,
              classificationCategory: classCategory,
              amount: netValue
            }
          }
        }
      });
    });
  }

  return { invoiceDetails: details };
    }

    function buildTaxesTotals(invoiceDetailsBlock) {
  const groups = {};

  // Iterate through all invoiceDetail lines
  invoiceDetailsBlock.invoiceDetails.forEach((d) => {
    const detail = d.invoiceDetail;
    const cat = detail.vatCategory;   // 1, 7, or 0
    const vat = detail.vatAmount || 0;
    const net = detail.netValue || 0;

    if (!groups[cat]) {
      groups[cat] = { net: 0, vat: 0 };
    }

    groups[cat].net += net;
    groups[cat].vat += vat;
  });

  const taxesArray = [];

  Object.keys(groups).forEach((cat) => {
    const group = groups[cat];

    taxesArray.push({
      taxes: {
        taxType: Number(cat),               // 1=24% , 7=13% , 0=exempt
        taxCategory: Number(cat),           // per schema
        netValue: +group.net.toFixed(2),
        vatAmount: +group.vat.toFixed(2)
      }
    });
  });

  return {
    taxesTotals: taxesArray
  };
    }
 

    function buildInvoiceSummary(invoiceDetailsBlock, taxesTotalsBlock) {
        let totalNet = 0;
        let totalVat = 0;
        let totalFees = 0;

        // ----------------------------------------
        // 1. SUM NET VALUES & VAT FROM DETAILS
        // ----------------------------------------
        invoiceDetailsBlock.invoiceDetails.forEach((d) => {
            const detail = d.invoiceDetail;
            const net = detail.netValue || 0;
            const vat = detail.vatAmount || 0;

            totalNet += net;
            totalVat += vat;

            // Tourism tax (fees)
            if (detail.vatCategory === 0 && detail.vatExemptionCategory === 5) {
            totalFees += net; // net = total tourism tax
            }
        });

        // ----------------------------------------
        // 2. CALCULATE GROSS
        // ----------------------------------------
        const totalGross = +(totalNet + totalVat).toFixed(2);

        // ----------------------------------------
        // 3. RETURN XML STRUCTURE
        // ----------------------------------------
        return {
            invoiceSummary: {
            totalNetValue: +totalNet.toFixed(2),
            totalVatAmount: +totalVat.toFixed(2),
            totalFeesAmount: +totalFees.toFixed(2),
            totalGrossValue: totalGross
            }
        };
    }

  /* -----------------------------------------------------
        9. BUILD PRETTY XML (AADE v1.0.12)
  ----------------------------------------------------- */
 
    const builder = require("xmlbuilder2");

    function buildMyDataInvoiceXML(payload, settings) {

    const header = buildInvoiceHeader(payload);
    const issuer = buildIssuer(payload);
    const counterpart = buildCounterpart(payload);
    const details = buildInvoiceDetails(payload);
    const taxesTotals = buildTaxesTotals(details);
    const summary = buildInvoiceSummary(details, taxesTotals);

    // AADE v1.0.12 ROOT: MUST BE EXACTLY LIKE THIS
    const rootObj = {
        InvoicesDoc: {
        '@xmlns': 'http://www.aade.gr/myDATA/invoice/v1.0',
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',

        Invoices: {
            Invoice: {
            invoiceHeader: header.invoiceHeader,
            issuer: issuer.issuer,
            counterpart: counterpart.counterpart,
            invoiceDetails: details.invoiceDetails,
            taxesTotals: taxesTotals.taxesTotals,
            invoiceSummary: summary.invoiceSummary
            }
        }
        }
    };

    const xml = create(rootObj).end({ prettyPrint: true });
    return xml;
    }
        
   // module.exports = { buildMyDataInvoiceXML };

}
 
