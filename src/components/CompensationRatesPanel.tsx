import React, { useState, useEffect } from "react";
import { StateRate } from "../types";
import { getDocs, collection, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { BookOpen, Upload, ClipboardCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface CompensationRatesPanelProps {
  selectedState: string;
  selectedRateId: string | null;
  onSelectRate: (rateId: string | null, rateValue: number, rateItem: StateRate | null) => void;
  calculatedArea: number;
}

export default function CompensationRatesPanel({
  selectedState,
  selectedRateId,
  onSelectRate,
  calculatedArea
}: CompensationRatesPanelProps) {
  const [rates, setRates] = useState<StateRate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [parsing, setParsing] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedRate, setSelectedRateState] = useState<StateRate | null>(null);
  const [multiplierValue, setMultiplierValue] = useState<number>(0);

  // Load existing rates in Firestore for this selected state
  useEffect(() => {
    fetchRatesForState();
  }, [selectedState]);

  const fetchRatesForState = async () => {
    setLoading(true);
    setUploadStatus(null);
    
    const getSeedRates = (stateName: string): StateRate[] => {
      if (stateName === "Akwa Ibom") {
        return [
          { id: "akwaibom-1", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Fence wall - Plastered & painted with razor wire (2.5m height)", rate: 40000, unit: "per Metre Run" },
          { id: "akwaibom-2", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Fence wall - Plastered & painted with electric security wire", rate: 50000, unit: "per Metre Run" },
          { id: "akwaibom-3", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Lock Up Shop - Long span aluminum, PVC ceiling, ceramic tiles", rate: 95000, unit: "per sqm" },
          { id: "akwaibom-4a", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Bungalow - CIS/CAS corrugated roof, PVC ceiling, screed floor", rate: 105000, unit: "per sqm" },
          { id: "akwaibom-4b", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Bungalow - Aluminum roof sheet, POP ceiling, ceramic tile floor", rate: 115000, unit: "per sqm" },
          { id: "akwaibom-4c", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Bungalow - Stone-coated tile roof, POP, marble/granite floors", rate: 122500, unit: "per sqm" },
          { id: "akwaibom-5", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Bungalow (Open/Event Hall) - POP ceiling, ceramic tile floor", rate: 122500, unit: "per sqm" },
          { id: "akwaibom-6a", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Storey Building (G+1 Floor) - Aluminum roofing, POP, ceramic floors", rate: 210000, unit: "per sqm" },
          { id: "akwaibom-6b", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Storey Building (G+1 Floor) - Stone-coated, POP, granite/marble floors", rate: 235000, unit: "per sqm" },
          { id: "akwaibom-7", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Office Complex (High Rise, above 3 floors requiring cranes)", rate: 260000, unit: "per sqm" },
          { id: "akwaibom-8", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Church Cathedral - Aluminum roof on iron trusses, ceramic floors", rate: 150000, unit: "per sqm" },
          { id: "akwaibom-9", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Warehouse (6m headroom) - Alum roof on steel, concrete floor", rate: 210000, unit: "per sqm" },
          { id: "akwaibom-10", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Special Building - Reinforced concrete walls & ceilings throughout", rate: 310000, unit: "per sqm" },
          { id: "akwaibom-11", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Institutional Multi-Storey (Hotels, Hospitals, Hostels)", rate: 235000, unit: "per sqm" },
          { id: "akwaibom-12", userId: "system", state: "Akwa Ibom", itemType: "Building", itemName: "Banking Hall with reinforced concrete security wall", rate: 275000, unit: "per sqm" },
          { id: "akwaibom-13", userId: "system", state: "Akwa Ibom", itemType: "Other", itemName: "Concrete Pavement - Interlocking concrete pave stones", rate: 16000, unit: "per sqm" },
          { id: "akwaibom-14", userId: "system", state: "Akwa Ibom", itemType: "Other", itemName: "Overhead Steel Tank Stand - H-section below 10m height", rate: 1500000, unit: "per installation" },
          { id: "akwaibom-15", userId: "system", state: "Akwa Ibom", itemType: "Other", itemName: "Water System - 4-inch deep borehole + 1.5/2hp submersible pump", rate: 550000, unit: "per installation" },
          { id: "akwaibom-crop1", userId: "system", state: "Akwa Ibom", itemType: "Crop", itemName: "Oil Palm Tree - Mature fruit bearing stand", rate: 18000, unit: "per stand" },
          { id: "akwaibom-crop2", userId: "system", state: "Akwa Ibom", itemType: "Crop", itemName: "Cassava Tuber Cultivation - Mature high yield stand", rate: 2000, unit: "per stand" }
        ];
      }
      return [
        { id: "seed-1", userId: "system", state: stateName, itemType: "Building", itemName: "Reinforced Block wall foundation", rate: 450, unit: "per sqm" },
        { id: "seed-2", userId: "system", state: stateName, itemType: "Crop", itemName: "High Yielding Cocoa Trees", rate: 35, unit: "per stand" },
        { id: "seed-3", userId: "system", state: stateName, itemType: "Crop", itemName: "Cassava / Manihot Tuber Crops", rate: 15, unit: "per stand" },
        { id: "seed-4", userId: "system", state: stateName, itemType: "Land", itemName: "Approved Plot Valuation Guide rate", rate: 12000, unit: "per sqm" },
        { id: "seed-5", userId: "system", state: stateName, itemType: "Building", itemName: "Sandcrete Blocks (Standard Blockwork)", rate: 250, unit: "per sqm" }
      ];
    };

    try {
      const q = query(collection(db, "stateRates"), where("state", "==", selectedState));
      const snapshot = await getDocs(q);
      const itemsList: StateRate[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        itemsList.push({
          id: doc.id,
          userId: d.userId,
          state: d.state,
          itemType: d.itemType,
          itemName: d.itemName,
          rate: d.rate,
          unit: d.unit,
          updatedAt: d.updatedAt
        });
      });

      if (itemsList.length === 0) {
        const seedCollection = getSeedRates(selectedState);
        setRates(seedCollection);
        if (selectedRateId) {
          const active = seedCollection.find(r => r.id === selectedRateId);
          if (active) {
            setSelectedRateState(active);
          }
        }
      } else {
        setRates(itemsList);
        if (selectedRateId) {
          const active = itemsList.find(r => r.id === selectedRateId);
          if (active) {
            setSelectedRateState(active);
          }
        }
      }
    } catch (err) {
      console.warn("Error loading rates, fallback to defaults:", err);
      const seedCollection = getSeedRates(selectedState);
      setRates(seedCollection);
      if (selectedRateId) {
        const active = seedCollection.find(r => r.id === selectedRateId);
        if (active) {
          setSelectedRateState(active);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  // Convert uploaded file to base64 and invoke backend parser
  const processUploadedFile = async (file: File) => {
    setParsing(true);
    setUploadStatus(null);
    try {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = async () => {
        const base64Content = fileReader.result?.toString().split(",")[1];
        if (!base64Content) {
          throw new Error("Unable to parse file stream.");
        }

        // Call server-side parsing endpoint
        const response = await fetch("/api/gemini/parse-rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileContent: base64Content,
            fileName: file.name,
            fileMimeType: file.type || "text/plain",
            textPrompt: `Extract values as compensation guidelines specifically for the state of: ${selectedState}`
          })
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || "Gemini parsing server error");
        }

        const items = data.result?.items;
        if (!items || !Array.isArray(items) || items.length === 0) {
          throw new Error("Gemini completed parsing but no valid items were found.");
        }

        // Save each parsed rate item to Firestore StateRates
        let countSaved = 0;
        for (const item of items) {
          const payload = {
            userId: "user-provided",
            state: selectedState,
            itemType: item.itemType || "Other",
            itemName: item.itemName,
            rate: Number(item.rate),
            unit: item.unit || "per item",
            updatedAt: serverTimestamp()
          };
          try {
            await addDoc(collection(db, "stateRates"), payload);
            countSaved++;
          } catch (wrErr) {
            handleFirestoreError(wrErr, OperationType.WRITE, "stateRates");
          }
        }

        setUploadStatus({
          type: "success",
          message: `Successfully processed "${file.name}"! AI extracted and saved ${countSaved} rates for ${selectedState}.`
        });
        
        // Refresh list
        fetchRatesForState();
      };
    } catch (err: any) {
      console.error("Upload process error:", err);
      setUploadStatus({
        type: "error",
        message: err.message || "Failed to parse rate sheet document."
      });
    } finally {
      setParsing(false);
    }
  };

  const handleSelectRateItem = (rate: StateRate) => {
    setSelectedRateState(rate);
    // Calculated amount = Rate value * area or multiplier
    const initialMultiplier = rate.unit.includes("sqm") || rate.unit.includes("ha") ? calculatedArea : 1;
    setMultiplierValue(initialMultiplier);
    onSelectRate(rate.id, rate.rate * initialMultiplier, rate);
  };

  const handleMultiplierChange = (val: number) => {
    setMultiplierValue(val);
    if (selectedRate) {
      onSelectRate(selectedRate.id, selectedRate.rate * val, selectedRate);
    }
  };

  const selectedRateAssignedValue = selectedRate ? selectedRate.rate * multiplierValue : 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-6" id="state-rates-panel-card">
      <div>
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="text-blue-600 h-5 w-5" />
          Statutory State Compensation Rates
        </h3>
        <p className="text-xs text-slate-500">
          Pick statutory structures or agricultural crop values aligned with the Ministry of Lands of <strong>{selectedState}</strong>.
        </p>
      </div>

      {/* Prompts warning checking whether rate sheet exists */}
      <div className="p-4 border border-blue-100 bg-blue-50/40 rounded-lg space-y-2">
        <div className="flex items-start gap-2.5">
          <ClipboardCheck className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-900 block uppercase tracking-wider font-mono">
              {selectedState} Rate Card Status
            </span>
            <p className="text-xs text-blue-700 leading-normal">
              {rates.length > 0
                ? `The database contains ${rates.length} official reference multipliers for ${selectedState} jurisdiction. Tap any guide line item below to compute values.`
                : `No default rates sheet matches for ${selectedState}. Please upload official rate tables below.`}
            </p>
          </div>
        </div>
      </div>

      {/* Rates list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-500">
          <Loader2 className="animate-spin h-6 w-6 text-blue-600 mb-2" />
          <p className="text-xs font-mono text-slate-400">ACCESSING LAND REGISTRY INDEXES...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rates.length > 0 && (
            <div className="max-h-[220px] overflow-y-auto border border-slate-250 rounded-lg divide-y divide-slate-200 bg-slate-50/60 pr-1">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  onClick={() => handleSelectRateItem(rate)}
                  className={`p-3 text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    selectedRateId === rate.id
                      ? "bg-blue-600 text-white"
                      : "hover:bg-slate-100 text-slate-700 bg-white"
                  }`}
                  id={`rate-item-${rate.id}`}
                >
                  <div className="space-y-0.5">
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                      selectedRateId === rate.id ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {rate.itemType}
                    </span>
                    <h5 className="font-semibold text-xs leading-normal mt-1">{rate.itemName}</h5>
                  </div>
                  <div className="text-right font-mono text-xs shrink-0">
                    <span className={`font-bold pr-1 ${selectedRateId === rate.id ? "text-white" : "text-blue-600"}`}>
                      ₦{rate.rate.toLocaleString()}
                    </span>
                    <span className="text-[10px] opacity-75">{rate.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Multiplier configuration if rate is selected */}
      {selectedRate && (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3" id="rate-calculation-overlay">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Depreciated Replacement Value Subtotal</span>
            <span className="font-mono text-xs text-blue-600 font-bold">₦{selectedRateAssignedValue.toLocaleString()}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="text-xs text-slate-500">
              Selected rate: <strong className="text-slate-700">₦{selectedRate.rate.toLocaleString()}</strong> {selectedRate.unit}.
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-650 shrink-0 font-medium">Quantity multiplier:</label>
              <input
                type="number"
                value={multiplierValue}
                onChange={(e) => handleMultiplierChange(parseFloat(e.target.value) || 0)}
                className="w-full text-right p-1.5 border border-slate-250 rounded-lg text-xs font-mono bg-white focus:border-blue-600"
                placeholder="e.g. Area or headcount"
                id="multiplier-input"
              />
            </div>
          </div>
          
          {selectedRate.unit.includes("sqm") && calculatedArea > 0 && multiplierValue !== calculatedArea && (
            <button
              onClick={() => handleMultiplierChange(calculatedArea)}
              className="text-[10px] text-blue-600 flex items-center gap-1 hover:underline cursor-pointer"
              type="button"
            >
              Apply CAD calculated Area ({calculatedArea} m²) as statutory multiplier
            </button>
          )}
        </div>
      )}

      {/* Drag & Drop Upload rate sheet form */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700 block">Digitize Rate Sheet File (PDF / CSV)</span>
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all relative cursor-pointer ${
            dragActive ? "border-blue-500 bg-blue-50/20" : "border-slate-300 hover:border-blue-300"
          }`}
          id="rate-sheet-drag-drop-zone"
        >
          <input
            type="file"
            multiple={false}
            onChange={handleFileChange}
            accept=".csv, .txt, .pdf, .png, .jpg, .jpeg"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            id="rate-sheet-file-input"
          />
          
          {parsing ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-850 block">Gemini Parsing Rate Document...</span>
                <p className="text-[10px] text-slate-400 font-mono">EXTRACTING TABLE HEADERS, UNIT RATES, CATEGORIZATIONS</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="bg-slate-100 p-2.5 rounded-full text-slate-500">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">
                  <span className="text-blue-600 hover:underline">Click to upload</span> or drag and drop official schedule
                </p>
                <p className="text-[10px] text-slate-400">
                  Accepts scanned PDF schedules, CSV sheets, raw Text, or camera snapshots.
                </p>
              </div>
            </div>
          )}
        </div>

        {uploadStatus && (
          <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
            uploadStatus.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-red-50 text-red-800 border border-red-100"
          }`} id="upload-status-notif">
            {uploadStatus.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold">{uploadStatus.type === "success" ? "File Document Processed" : "Parsing Failed"}</span>
              <p className="mt-0.5 leading-relaxed">{uploadStatus.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
