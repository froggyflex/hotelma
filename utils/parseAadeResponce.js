import xml2js from "xml2js";

export async function parseAaderResponse(xmlString) {
  try {
    const cleanXml = xmlString
      .replace(/^<string[^>]*>/, "")
      .replace(/<\/string>$/, "")
      .trim();

    const parsed = await xml2js.parseStringPromise(cleanXml, {
      explicitArray: false,
      ignoreAttrs: false
    });

    const response = parsed?.ResponseDoc?.response;

    if (!response) {
      return {
        ok: false,
        error: "Malformed response from AADE",
        raw: xmlString,
      };
    }

    const status = response.statusCode;
    const mark = response.invoiceMark || null;
    const uid = response.invoiceUid || null;
    const auth = response.authenticationCode || null;

    if (status === "Success" || mark) {
      return {
        ok: true,
        mark,
        uid,
        auth,
        raw: xmlString,
      };
    }

    // Extract errors
    const errors = [];
    const errorList = response.errors?.error;

    if (Array.isArray(errorList)) {
      errorList.forEach(err => 
        errors.push({
          code: err.code,
          message: err.message
        })
      );
    } else if (errorList) {
      errors.push({
        code: errorList.code,
        message: errorList.message
      });
    }

    return {
      ok: false,
      errors,
      raw: xmlString
    };

  } catch (err) {
    return {
      ok: false,
      error: "Failed to parse AADE response",
      details: err.message,
      raw: xmlString,
    };
  }
}