import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON body limits for base64 photo payloads and rate sheets
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini client securely server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// JSON error helper
const sendError = (res: express.Response, message: string, status = 500) => {
  res.status(status).json({ success: false, error: message });
};

// API: Parse uploaded rate sheet using Gemini
app.post("/api/gemini/parse-rates", async (req, res) => {
  try {
    const { fileContent, fileName, fileMimeType, textPrompt } = req.body;

    if (!fileContent && !textPrompt) {
      return sendError(res, "Either fileContent or textPrompt must be provided.", 400);
    }

    let contents: any[] = [];

    if (fileContent) {
      // Inline multi-part data (could be PNG, JPEG, PDF, TXT, CSV)
      contents.push({
        inlineData: {
          mimeType: fileMimeType || "text/plain",
          data: fileContent, // base64 encoded data
        },
      });
    }

    contents.push({
      text: `Analyze the provided compensation rate sheet file/text. 
Extract all distinct item rates with their corresponding description/name, the category of item (like 'Crop', 'Building', 'Tree', 'Land', or 'Other'), the numeric rate, and the unit of measurement (e.g. 'per tree', 'per stand', 'per sqm', 'per meter', etc.).
Current context prompt: ${textPrompt || "Extract all rate details."}

Format the output strictly as a JSON object containing an 'items' array of parsed rate entries.`,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              description: "List of extracted compensation rate items",
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: { type: Type.STRING, description: "Name/description of the item (e.g., Cassava, Block wall)" },
                  itemType: { 
                    type: Type.STRING, 
                    description: "Category of the rate",
                    enum: ["Crop", "Building", "Tree", "Land", "Other"]
                  },
                  rate: { type: Type.NUMBER, description: "Numeric rate of compensation" },
                  unit: { type: Type.STRING, description: "Unit of measurement (e.g. per sqm, per tree, per acre)" }
                },
                required: ["itemName", "itemType", "rate", "unit"]
              }
            }
          },
          required: ["items"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini.");
    }

    const parsedResult = JSON.parse(responseText.trim());
    res.json({ success: true, result: parsedResult });

  } catch (err: any) {
    console.error("Gemini parse-rates error:", err);
    sendError(res, err.message || "Failed to parse rate sheet.");
  }
});

// API: Generate structured Valuation & Inspection Report
app.post("/api/gemini/generate-report", async (req, res) => {
  try {
    const { property, selectedRate, selectedComparable } = req.body;

    if (!property) {
      return sendError(res, "Property data is required to generate report.", 400);
    }

    const payloadText = `
    PROPERTY DETAIL NOTES:
    - Name: ${property.name}
    - Location/Address: ${property.address || "N/A"}
    - Valuer: ${property.valuerName || "Unspecified"}
    - Property Owner / Claimant: ${property.ownerName || "Unspecified"}
    - Inspection Date: ${property.inspectionDate || "N/A"}
    - Property Type: ${property.propertyType || "N/A"}
    - valuationPurpose: ${property.valuationPurpose}
    - State: ${property.state || "N/A"}
    - Field Notes: ${property.notes || "None"}
    
    GEOSPATIAL & SKETCH CALCULATIONS:
    - GPS Coordinates: Lat: ${property.latitude || "N/A"}, Lng: ${property.longitude || "N/A"}
    - Calculated Area: ${property.calculatedArea || 0} sqm (from AutoCAD sketch)
    - Calculated Perimeter: ${property.calculatedPerimeter || 0} m
    - Override Area: ${property.overrideArea ? property.overrideArea + " sqm" : "None"}
    - Map Pin active: ${property.latitude ? "Yes" : "No"}

    VALUATION BENCHMARKS USED:
    ${property.valuationPurpose === "compensation" ? 
      `- COMPENSATIONS METHOD
       - Selected State Rate Item: ${selectedRate ? `${selectedRate.itemName} (${selectedRate.itemType}) at ${selectedRate.rate} per ${selectedRate.unit}` : "No rate linked"}` :
      `- MARKET/RENTAL METHOD (Previous Comparable Valuation)
       - Comparable Selected: ${selectedComparable ? `${selectedComparable.propertyType} in ${selectedComparable.areaName} (${selectedComparable.sizeSqm} sqm), valued at sale of ${selectedComparable.saleValue || "N/A"} / rental ${selectedComparable.rentalValue || "N/A"}` : "No comparable linked"}`
    }

    TOTAL CALCULATED APPRAISAL VALUE:
    - Net Value: ${property.valuationAmount ? property.valuationAmount.toLocaleString() : "To be determined"}
    `;

    const systemPrompt = `You are an expert Chartered Valuer and Real Estate Appraiser. 
Generate a professional, formal, and comprehensive Valuation & Inspection Field Report based on the provided field notes and sketch measurements. 
The report must look highly polished, authoritative, and closely resemble a professional, corporate Certificate of Value.

CRITICAL INSTRUCTIONS FOR RECONCILIATION & VALUATION:
1. UNIFIED ASSET VALUATION (NO BUILDING COMPONENT BREAKDOWN): 
   - DO NOT separate or break down each individual physical structural component of a building (e.g., do not create separate rows or sections for walls, roofs, windows, doors, plastering, finishes, plumbing, or foundation). 
   - Instead, treat each building structure as a whole unified, cohesive asset (e.g. 'Main Residential Bungalow Block', 'Warehouse Complex', or 'Main Office Structure') with its cumulative GIA (Gross Internal Area) and an overall rate per square meter.
   - For agricultural/crop compensations, list crops/items in whole unified categories or counts rather than dividing them into structural components.
   - This aligns directly with professional certificates of value.

2. STRICTLY NO ASTERISK CHARACTERS (*):
   - Under no circumstances should any asterisk (*) characters appear anywhere in the output report text. 
   - DO NOT use double asterisks (**word**) or single asterisks (*word*) for bolding, italics, emphasis, or bullet points.
   - For emphasis or sub-headers, use UPPERCASE text or standard markdown headers (like #, ##) completely free of inner asterisks.
   - For lists, use simple hyphens (-) or numerals (1., 2.).
   - The entire report output must contain zero (0) asterisk characters.

Include the following sections in your clean plain-text markdown:
1. EXECUTIVE SUMMARY & CERTIFICATE OF VALUE
2. SUBJECT PROPERTY IDENTIFICATION (GPS coordinates, geopolitical state, boundaries)
3. PHYSICAL SKETCH & DIMENSIONAL DETAILS (Calculated Area in square meters from AutoCAD sketch, Perimeter, and overrides if any)
4. BASE OF VALUATION & METHODOLOGY (Explain Direct Comparison / Market Approach or Depreciated Replacement Cost unified method)
5. VALUATION ANALYSIS & COMPUTATION SHEET (A clear table representing the whole unified asset structures or crop inventories with high-level rates and values)
6. GENERAL FIELD INSPECTION FINDINGS & OBSERVATIONS
7. CHARTERED ESTATE SURVEYORS AND VALUERS VALIDATION & SIGN-OFF INDEX (Leave formal signature line)

Do not output any preamble, introductory comment, or chat transition greeting. Start directly with the main heading line: '# SURVEYORS FIELD INSPECTION AND VALUATION REPORT'`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: payloadText,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // low temperature for consistent professional report structure
      }
    });

    res.json({ success: true, reportMarkdown: response.text });

  } catch (err: any) {
    console.error("Gemini generate-report error:", err);
    sendError(res, err.message || "Failed to generate report.");
  }
});

// Setup Vite Dev Server / Static Hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
