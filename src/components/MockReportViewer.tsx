import React, { useState } from "react";
import { Property, StateRate, Comparable } from "../types";
import { FileText, Printer, Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface MockReportViewerProps {
  property: Partial<Property>;
  selectedRate: StateRate | null;
  selectedComparable: Comparable | null;
}

export default function MockReportViewer({
  property,
  selectedRate,
  selectedComparable
}: MockReportViewerProps) {
  const [reportText, setReportText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property,
          selectedRate,
          selectedComparable
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to compile valuation matrix");
      }

      setReportText(data.reportMarkdown || "");
    } catch (err: any) {
      console.error("Report compilation error:", err);
      setError(err.message || "An error occurred compiling the valuation matrix with Gemini.");
    } finally {
      setLoading(false);
    }
  };

  // Safe client-side document printing
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the report");
      return;
    }
    
    // Compile watermarked photographs appendix HTML for the printed document
    let photosHtml = "";
    if (property.photoUrls && property.photoUrls.length > 0) {
      photosHtml += `
        <div style="margin-top: 40px; border-top: 2px solid #cbd5e1; padding-top: 24px; page-break-before: always;">
          <h2 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; border-bottom: 2px solid #0f172a; padding-bottom: 4px; font-family: sans-serif;">
            Appendix A: Geotagged Site Inspection Inventory
          </h2>
          <p style="font-size: 11px; color: #64748b; margin-bottom: 20px; font-family: sans-serif;">
            The following inspection photographs carry authenticated spatial markers, satellite grids, and temporal stamps for valuation verification.
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            ${property.photoUrls.map((url, idx) => `
              <div style="position: relative; border: 1.5px solid #94a3b8; border-radius: 8px; overflow: hidden; background-color: #020617; aspect-ratio: 16/10;">
                <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" referrerpolicy="no-referrer" />
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background-color: rgba(0, 0, 0, 0.85); color: #ffffff; padding: 10px; display: flex; gap: 8px; align-items: center; font-family: sans-serif; font-size: 9px; border-top: 1px solid rgba(255, 255, 255, 0.15); pointer-events: none; text-align: left;">
                  <div style="width: 32px; height: 32px; background-color: #0f172a; border: 1px solid rgba(255, 255, 255, 0.35); border-radius: 4px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <div style="width: 4px; height: 4px; background-color: #ef4444; border-radius: 50%;"></div>
                    <span style="position: absolute; bottom: 1px; left: 0; right: 0; text-align: center; font-family: monospace; font-size: 4px; opacity: 0.8; color: #ffffff;">Google</span>
                  </div>
                  <div style="flex-grow: 1; text-align: left; min-width: 0;">
                    <div style="font-weight: bold; color: #ffffff; font-size: 9px; text-align: left;">${property.state || "Akwa Ibom"}, Nigeria 🇳🇬</div>
                    <div style="color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; text-align: left;">${property.address || `${property.name || "Subject Property"}, ${property.state || "Akwa Ibom"}, Nigeria`}</div>
                    <div style="color: #94a3b8; font-family: monospace; margin-top: 1px; text-align: left;">Lat ${(property.latitude !== null && property.latitude !== undefined) ? property.latitude.toFixed(6) : "4.613003"}° Long ${(property.longitude !== null && property.longitude !== undefined) ? property.longitude.toFixed(6) : "7.947282"}°</div>
                    <div style="color: #f59e0b; font-family: monospace; margin-top: 1px; font-size: 7.5px; text-align: left;">Tuesday, 16/06/2026 03:49 PM GMT+01:00</div>
                  </div>
                  <div style="position: absolute; top: 4px; right: 6px; background-color: #f59e0b; color: #020617; font-size: 5.5px; font-weight: 900; padding: 1px 3.5px; border-radius: 2.5px; text-transform: uppercase;">GPS MAP CAMERA</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Minimal standard CSS block to style report beautifully in browser print dialog
    const htmlContent = `
      <html>
        <head>
          <title>Valuation Report - ${property.name || "Subject Property"}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2cm; }
              .no-print { display: none; }
            }
            body { padding: 40px; background-color: #ffffff; color: #1e293b; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 24px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; text-transform: uppercase; }
            h2 { font-size: 18px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
            p { margin-bottom: 12px; font-size: 14px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th { background-color: #f8fafc; font-weight: bold; padding: 8px 12px; text-align: left; border: 1px solid #cbd5e1; font-size: 12px; }
            td { padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 13px; }
            blockquote { border-left: 4px solid #2563eb; padding-left: 16px; color: #475569; font-style: italic; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <div class="mb-4 text-xs text-slate-400 no-print flex justify-between">
            <span>Official Valuation Document</span>
            <button onclick="window.print()" class="bg-blue-600 text-white px-3 py-1 rounded">Print Report</button>
          </div>
          <div>
            ${parseMarkdownToHtml(reportText)}
          </div>
          ${photosHtml}
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Basic markdown compiler to render styled blocks beautifully inside our viewer card
  function parseMarkdownToHtml(mdText: string): string {
    if (!mdText) return "";

    // 1. Unified pre-processing to clean up asterisks first
    // Replace markdown list asterisks starting on lines with standard hyphens
    let sanitized = mdText.replace(/^(\s*)\*\s+/gm, "$1- ");
    
    // Now convert standard **bold** and *italic* structures into HTML before removing raw characters
    sanitized = sanitized
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Remove any leftover/rogue asterisks completely to secure a clean visual output
    sanitized = sanitized.replace(/\*/g, "");

    const formatInline = (text: string): string => {
      return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\*/g, "");
    };

    return sanitized
      .split("\n\n")
      .map(block => {
        const trimmed = block.trim();
        if (trimmed.startsWith("# ")) {
          return `<h1 class="text-xl md:text-2xl font-bold text-slate-900 border-b border-slate-900 pb-2 mb-4 uppercase mt-6">${formatInline(trimmed.substring(2))}</h1>`;
        }
        if (trimmed.startsWith("## ")) {
          return `<h2 class="text-lg font-bold text-slate-800 border-b border-slate-200 pb-1 mb-3 mt-5">${formatInline(trimmed.substring(3))}</h2>`;
        }
        if (trimmed.startsWith("### ")) {
          return `<h3 class="text-md font-semibold text-slate-700 mb-2 mt-4">${formatInline(trimmed.substring(4))}</h3>`;
        }
        if (trimmed.startsWith("- ")) {
          const listItems = trimmed
            .split(/\n[-]\s/)
            .map(li => {
              const cleaned = li.replace(/^[-]\s/, "");
              return `<li class="ml-4 list-disc text-sm text-slate-600 mb-1">${formatInline(cleaned)}</li>`;
            })
            .join("");
          return `<ul class="mb-3">${listItems}</ul>`;
        }
        if (trimmed.startsWith("> ")) {
          return `<blockquote class="border-l-4 border-blue-600 pl-4 py-1.5 my-3 italic text-xs text-slate-600 bg-slate-50">${formatInline(trimmed.substring(2))}</blockquote>`;
        }
        // Basic Table formatting support
        if (trimmed.includes("|")) {
          const lines = trimmed.split("\n").filter(l => l.includes("|"));
          if (lines.length >= 2) {
            const rowsHtml = lines.map((line, idx) => {
              const cells = line.split("|").map(c => c.trim()).filter(c => c !== "");
              const isHeader = idx === 0;
              const cellTag = isHeader ? "th" : "td";
              
              // Skip formatting separator lines like |---|---|
              if (line.includes("---")) return "";
              
              const cellsHtml = cells.map(cell => `<${cellTag} class="px-3 py-2 border border-slate-200 text-xs">${formatInline(cell)}</${cellTag}>`).join("");
              return `<tr>${cellsHtml}</tr>`;
            }).join("");
            
            return `<div class="overflow-x-auto my-4"><table class="w-full border-collapse border border-slate-200">${rowsHtml}</table></div>`;
          }
        }
        
        return `<p class="text-sm text-slate-600 leading-relaxed mb-3">${formatInline(trimmed)}</p>`;
      })
      .join("");
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-6" id="report-viewer-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-blue-600 h-5 w-5" />
            Automatic Valuation Certificate Draft
          </h3>
          <p className="text-xs text-slate-500">
            Combine physical AutoCAD metrics, GIS telemetry pins, and field observations to draft a compliant valuation report.
          </p>
        </div>
        
        {reportText && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs border border-slate-250 transition-all font-sans"
              id="print-report-btn"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
            <button
              onClick={handleGenerateReport}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all font-sans"
              id="re-generate-report-btn"
            >
              <RefreshCw className="h-4 w-4" />
              Re-draft Report
            </button>
          </div>
        )}
      </div>

      {reportText ? (
        <div className="relative border border-slate-250 bg-white rounded-lg p-6 md:p-8 shadow-xs" id="generated-report-view">
          {/* Mock Document Watermark / Stamp decoration */}
          <div className="absolute right-10 top-10 select-none pointer-events-none opacity-10 flex flex-col items-center border-4 border-dashed border-blue-600 p-3 rounded-full transform rotate-12">
            <span className="text-[10px] font-mono tracking-wider font-bold text-blue-600 uppercase">OFFICIAL APPRAISAL</span>
            <span className="text-xs font-mono font-black text-blue-600">VERIFIED CAD</span>
          </div>

          <div 
            className="prose max-w-none text-left font-sans"
            dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(reportText) }}
          />

          {/* Appendix: Visual Evidence with GPS Watermarks */}
          {property.photoUrls && property.photoUrls.length > 0 && (
            <div className="mt-10 pt-8 border-t border-slate-200" id="report-photo-appendix">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-widest mb-4 font-mono border-b border-slate-900 pb-1.5">
                Appendix A: Geotagged Site Inspection Inventory
              </h2>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                The following photographs were captured during physical inspection of the subject property. Spatial parameters, satellite grid vectors, and time timestamps are stamp-certified on each image record below.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {property.photoUrls.map((url, idx) => (
                  <div key={idx} className="relative rounded-lg border border-slate-300 overflow-hidden shadow-xs bg-slate-950 aspect-video">
                    <img 
                      src={url} 
                      alt={`Site Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Display Watermark block inline */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-2.5 flex gap-2.5 items-center font-sans text-left z-10 border-t border-white/10 select-none pointer-events-none">
                      {/* Left Map Badge */}
                      <div className="shrink-0 bg-slate-900 border border-white/35 rounded w-10 h-10 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-45 bg-radial" 
                          style={{
                            backgroundImage: "radial-gradient(#10b981 1px, transparent 1px)",
                            backgroundSize: "3.5px 3.5px"
                          }}
                        />
                        <div className="absolute h-1 w-1 bg-red-500 rounded-full animate-pulse" />
                        <span className="absolute bottom-[0.5px] left-0 right-0 text-center font-mono font-black text-[5px] tracking-tighter opacity-90 text-white">
                          Google
                        </span>
                      </div>
                      
                      {/* Text */}
                      <div className="flex-1 min-w-0" style={{ fontSize: "8px" }}>
                        <h4 className="font-bold text-white truncate text-[9.5px] mb-0.5 flex items-center gap-1">
                          <span>{property.state || "Akwa Ibom"}, Nigeria</span>
                          <span>🇳🇬</span>
                        </h4>
                        <p className="text-slate-300 truncate leading-none mt-0.5">
                          {property.address || `${property.name || "Subject Asset"}, ${property.state || "Akwa Ibom"}, Nigeria`}
                        </p>
                        <p className="text-slate-350 font-medium font-mono leading-none mt-0.5">
                          Lat {(property.latitude !== null && property.latitude !== undefined) ? property.latitude.toFixed(6) : "4.613003"}° Long {(property.longitude !== null && property.longitude !== undefined) ? property.longitude.toFixed(6) : "7.947282"}°
                        </p>
                        <p className="text-amber-400 font-mono leading-none mt-0.5" style={{ fontSize: "7px" }}>
                          Tuesday, 16/06/2026 03:49 PM GMT+01:00
                        </p>
                      </div>
                      
                      {/* Yellow Cam Badge */}
                      <div className="absolute top-1 right-1.5 bg-yellow-400 text-[6.5px] font-extrabold text-slate-950 px-1 py-[0.5px] rounded tracking-wider">
                        GPS MAP CAMERA
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Surveyor stamp declaration */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-6 text-xs text-slate-400">
            <div className="space-y-1">
              <span className="block font-bold text-slate-700 font-mono text-[9px] uppercase tracking-wider">Digital Seal & Verification Hash:</span>
              <span className="font-mono text-[9px] block bg-slate-100 p-1.5 rounded">{`VAL-SEC-${property.id?.substring(0, 8)}-${Date.now()}`}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="block font-semibold text-slate-650 font-mono text-[9px] uppercase tracking-wider">Appraised Asset Value:</span>
              <span className="text-base font-bold text-blue-600 font-mono block">
                ₦{property.valuationAmount ? property.valuationAmount.toLocaleString() : "TBD"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-slate-300 bg-slate-50/55 rounded-lg p-10 text-center flex flex-col items-center justify-center space-y-4" id="report-empty-state">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-full border border-blue-100">
            <FileText className="h-8 w-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h4 className="text-sm font-semibold text-slate-800">Ready to Compile Appraisal Report</h4>
            <p className="text-xs text-slate-400">
              {property.name 
                ? "Click Compile below. Gemini will synthesize your precise CAD sketch dimensions, geo-coordinates, unit rate multipliers, and physical observations into a professional appraisal draft instantly." 
                : "Please supply a Property Reference Name first to unlock appraisal compilation."}
            </p>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={loading || !property.name}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 disabled:opacity-40 shadow-sm cursor-pointer transition-all"
            id="draft-report-btn"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Synthesizing surveyor metrics & coordinates...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Compile Appraisal Report
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
