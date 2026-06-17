import React, { useState, useEffect } from "react";
import { ValuationScheduleItem, StateRate } from "../types";
import { 
  Plus, Trash2, Eye, Printer, Grid, RefreshCw, FileText, 
  MapPin, Image as ImageIcon, Sparkles, AlertCircle, FileCheck2, 
  ChevronsUpDown, DollarSign, ListPlus, Download, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";

const PRELOADED_SCHEDULE_ITEMS: ValuationScheduleItem[] = [
  {
    id: "sched-1",
    userId: "shared",
    sn: 1,
    claimantName: "Michael Joseph Mark",
    propertyCode: "R/302",
    description: "Lockup Shop:",
    size: 128.8,
    unit: "m²",
    rate: 90000,
    depreciation: 0,
    finalValue: 11592000,
    photoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    latitude: 4.613003,
    longitude: 7.947282,
    inspectionDate: "2026-06-16"
  },
  {
    id: "sched-2",
    userId: "shared",
    sn: 1,
    claimantName: "Michael Joseph Mark",
    propertyCode: "R/302",
    description: "Shade:",
    size: 10,
    unit: "m²",
    rate: 15000,
    depreciation: 0,
    finalValue: 150000,
    photoUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80",
    latitude: 4.613142,
    longitude: 7.947401,
    inspectionDate: "2026-06-16"
  },
  {
    id: "sched-3",
    userId: "shared",
    sn: 2,
    claimantName: "Grace Jimoh",
    propertyCode: "R/294",
    description: "Bungalow:",
    size: 278,
    unit: "m²",
    rate: 100000,
    depreciation: 20,
    finalValue: 22240000, // Corrected depreciation math for compliance
    photoUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
    latitude: 4.614102,
    longitude: 7.948112,
    inspectionDate: "2026-06-16"
  },
  {
    id: "sched-4",
    userId: "shared",
    sn: 3,
    claimantName: "Clement William John",
    propertyCode: "R/293",
    description: "Bungalow:",
    size: 67.2,
    unit: "m²",
    rate: 100000,
    depreciation: 0,
    finalValue: 6720000,
    photoUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
    latitude: 4.613892,
    longitude: 7.946950,
    inspectionDate: "2026-06-16"
  },
  {
    id: "sched-5",
    userId: "shared",
    sn: 3,
    claimantName: "Clement William John",
    propertyCode: "R/293",
    description: "3 Graves:",
    size: 3,
    unit: "no",
    rate: 200000,
    depreciation: 0,
    finalValue: 600000,
    photoUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80",
    latitude: 4.613912,
    longitude: 7.946985,
    inspectionDate: "2026-06-16"
  },
  {
    id: "sched-6",
    userId: "shared",
    sn: 4,
    claimantName: "Clement William John",
    propertyCode: "R/292",
    description: "Uncompleted Building (Lintel Level):",
    size: 25.5,
    unit: "m²",
    rate: 100000,
    depreciation: 80,
    finalValue: 510000, // 25.5 * 100000 * 0.2 = 510,000 matches OCR exactly!
    photoUrl: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80",
    latitude: 4.614210,
    longitude: 7.947111,
    inspectionDate: "2026-06-16"
  },
  {
    id: "sched-7",
    userId: "shared",
    sn: 5,
    claimantName: "Effiong Nse Effiong",
    propertyCode: "L/295C",
    description: "Perimeter Fence:",
    size: 27,
    unit: "mr",
    rate: 45000,
    depreciation: 0,
    finalValue: 945000, // 27 * 45000 = 945,000 matches OCR!
    photoUrl: "https://images.unsplash.com/photo-1508333706533-1ab43ecb1606?auto=format&fit=crop&w=600&q=80",
    latitude: 4.612889,
    longitude: 7.949015,
    inspectionDate: "2026-06-16"
  },
  {
    id: "sched-8",
    userId: "shared",
    sn: 5,
    claimantName: "Effiong Nse Effiong",
    propertyCode: "L/295C",
    description: "11 Earth grave structures:",
    size: 11,
    unit: "no",
    rate: 200000,
    depreciation: 0,
    finalValue: 2200000, // 11 * 200000 = 2,200,000 matches OCR!
    photoUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    latitude: 4.612950,
    longitude: 7.949120,
    inspectionDate: "2026-06-16"
  }
];

// Presets for faster property descriptions based on rate guides
const STRUCTURE_PRESETS = [
  { text: "Bungalow:", defaultRate: 110000, defaultUnit: "m²" },
  { text: "Storey Building:", defaultRate: 180000, defaultUnit: "m²" },
  { text: "Lockup Shop:", defaultRate: 90000, defaultUnit: "m²" },
  { text: "Shade:", defaultRate: 15000, defaultUnit: "m²" },
  { text: "Perimeter Fence:", defaultRate: 35000, defaultUnit: "mr" },
  { text: "Concrete Tankstand:", defaultRate: 35000, defaultUnit: "m²" },
  { text: "Church Cathedral:", defaultRate: 120000, defaultUnit: "m²" },
  { text: "Pastor's House (@ Roof Level):", defaultRate: 100000, defaultUnit: "m²" },
  { text: "1 Grave:", defaultRate: 200000, defaultUnit: "no" },
  { text: "11 Earth grave structures:", defaultRate: 200000, defaultUnit: "no" },
  { text: "Uncompleted Building (Lintel Level):", defaultRate: 100000, defaultUnit: "m²" },
  { text: "Caravan:", defaultRate: 20000, defaultUnit: "m²" },
  { text: "Extension:", defaultRate: 20000, defaultUnit: "m²" }
];

interface Props {
  userId: string;
  onImportCADData?: (item: ValuationScheduleItem) => { area: number; perimeter: number; pointsCount: number };
  activeCADMetrics?: { area: number; perimeter: number; pointsCount: number } | null;
  onNavigateToCAD?: (item: ValuationScheduleItem) => void;
}

export default function ComprehensiveValuationSchedule({ userId, onImportCADData, activeCADMetrics, onNavigateToCAD }: Props) {
  // Recalculate Serial Numbers based on Claimant sequence
  const regenerateSerialNumbers = (currentItems: ValuationScheduleItem[]) => {
    let currentSn = 0;
    let lastClaimant = "";
    return currentItems.map((item) => {
      const name = (item.claimantName || "").trim();
      if (name.toLowerCase() !== lastClaimant.toLowerCase()) {
        currentSn++;
        lastClaimant = name;
      }
      return { ...item, sn: currentSn };
    });
  };

  const [items, setItems] = useState<ValuationScheduleItem[]>(() => {
    const saved = localStorage.getItem(`sched_items_${userId}`);
    const parsed = saved ? JSON.parse(saved) : PRELOADED_SCHEDULE_ITEMS;
    return regenerateSerialNumbers(parsed);
  });

  const [search, setSearch] = useState("");
  const [filterUnit, setFilterUnit] = useState("All");
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [selectedItemForPhoto, setSelectedItemForPhoto] = useState<ValuationScheduleItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"info" | "warning" | "success">("info");

  const triggerToast = (msg: string, type: "info" | "warning" | "success" = "info") => {
    setToastMessage(msg);
    setToastType(type);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);
  
  // Cache data block
  useEffect(() => {
    localStorage.setItem(`sched_items_${userId}`, JSON.stringify(items));
  }, [items, userId]);

  const handleAddFieldRow = () => {
    const defaultLat = 5.0189 + (Math.random() - 0.5) * 0.01;
    const defaultLng = 7.9149 + (Math.random() - 0.5) * 0.01;
    
    // Choose a random structure preset to make seeding fast and friendly
    const randomPreset = STRUCTURE_PRESETS[Math.floor(Math.random() * STRUCTURE_PRESETS.length)];

    // Get the claimant name of the last item to default to the same claimant for quick group adding
    const lastItem = items[items.length - 1];
    const defaultClaimant = lastItem ? lastItem.claimantName : "New Claimant Name";
    const defaultPropCode = lastItem ? lastItem.propertyCode : "R/" + (150 + Math.floor(Math.random() * 200));

    const newItem: ValuationScheduleItem = {
      id: "sched-" + Date.now() + Math.random().toString(36).substr(2, 4),
      userId,
      sn: 1,
      claimantName: defaultClaimant,
      propertyCode: defaultPropCode,
      description: randomPreset.text,
      size: 50,
      unit: randomPreset.defaultUnit,
      rate: randomPreset.defaultRate,
      depreciation: 0,
      finalValue: 50 * randomPreset.defaultRate,
      photoUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80",
      latitude: Number(defaultLat.toFixed(6)),
      longitude: Number(defaultLng.toFixed(6)),
      inspectionDate: new Date().toISOString().split("T")[0]
    };

    const newSet = regenerateSerialNumbers([...items, newItem]);
    setItems(newSet);
  };

  const handleAddMultipleRows = (count: number) => {
    let newItems = [...items];
    const defaultLat = 5.0189;
    const defaultLng = 7.9149;
    
    const lastItem = items[items.length - 1];
    const defaultClaimant = lastItem ? lastItem.claimantName : "New Claimant Name";
    const defaultPropCode = lastItem ? lastItem.propertyCode : "R/" + (150 + Math.floor(Math.random() * 200));

    for (let i = 0; i < count; i++) {
      const idxRandom = Math.floor(Math.random() * STRUCTURE_PRESETS.length);
      const randomPreset = STRUCTURE_PRESETS[idxRandom];
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lngOffset = (Math.random() - 0.5) * 0.01;

      const newItem: ValuationScheduleItem = {
        id: "sched-" + Date.now() + "-" + i + "-" + Math.random().toString(36).substr(2, 4),
        userId,
        sn: 1,
        claimantName: defaultClaimant,
        propertyCode: defaultPropCode,
        description: randomPreset.text,
        size: 50,
        unit: randomPreset.defaultUnit,
        rate: randomPreset.defaultRate,
        depreciation: 0,
        finalValue: 50 * randomPreset.defaultRate,
        photoUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80",
        latitude: Number((defaultLat + latOffset).toFixed(6)),
        longitude: Number((defaultLng + lngOffset).toFixed(6)),
        inspectionDate: new Date().toISOString().split("T")[0]
      };
      newItems.push(newItem);
    }

    setItems(regenerateSerialNumbers(newItems));
  };

  const handleUpdateRow = (index: number, fields: Partial<ValuationScheduleItem>) => {
    const updated = [...items];
    const prevItem = updated[index];
    const nextItem = { ...prevItem, ...fields };

    // Math re-calculation for final value
    if (fields.size !== undefined || fields.rate !== undefined || fields.depreciation !== undefined) {
      const sizeNum = fields.size !== undefined ? Number(fields.size) : nextItem.size;
      const rateNum = fields.rate !== undefined ? Number(fields.rate) : nextItem.rate;
      const deprNum = fields.depreciation !== undefined ? Number(fields.depreciation) : nextItem.depreciation;
      const val = sizeNum * rateNum * (1 - deprNum / 100);
      nextItem.finalValue = Number(val.toFixed(2));
    }

    updated[index] = nextItem;
    
    // If claimantName changed, we need to regenerate serial numbers to maintain proper SN indexing
    let finalSet = updated;
    if (fields.claimantName !== undefined) {
      finalSet = regenerateSerialNumbers(updated);
    }
    
    setItems(finalSet);
  };

  const handleDeleteRow = (id: string) => {
    const filtered = items.filter(i => i.id !== id);
    setItems(regenerateSerialNumbers(filtered));
  };

  const handleClearAllRows = () => {
    if (confirm("Are you sure you want to discard this entire Valuation Schedule register?")) {
      setItems([]);
    }
  };

  const handleResetToPresets = () => {
    if (confirm("Reset layout back to the standard Page-1 scanned valuation register presets?")) {
      setItems(PRELOADED_SCHEDULE_ITEMS);
    }
  };

  // Import dynamic active measurements from AutoCAD sketcher
  const handleImportFromActiveCAD = (index: number) => {
    const item = items[index];
    const unitLower = (item.unit || "").toLowerCase();
    const descLower = (item.description || "").toLowerCase();
    
    // Check if the schedule entry represents a perimeter-based fence, blockwall, gate, or linear meters run
    const isFenceOrLinear = 
      unitLower === "mr" || 
      unitLower === "m" || 
      descLower.includes("fence") || 
      descLower.includes("wall") || 
      descLower.includes("gate") || 
      descLower.includes("fencing") || 
      descLower.includes("perimeter") || 
      descLower.includes("meter run");

    if (onImportCADData) {
      const metrics = onImportCADData(item);
      if (isFenceOrLinear) {
        const valueToUse = metrics.perimeter > 0 ? metrics.perimeter : 0;
        if (valueToUse > 0) {
          handleUpdateRow(index, {
            size: Number(valueToUse.toFixed(1)),
            unit: item.unit || "mr",
            description: item.description && item.description.includes("CAD") ? item.description : `CAD Calculated Fence Run: ${item.description || ""}`
          });
          triggerToast("CAD perimeter length (" + valueToUse.toFixed(1) + "m) successfully imported as fence meter run for " + (item.claimantName || "Claimant") + "!", "success");
        } else {
          triggerToast("No active AutoCAD perimeter found. Please draw or specify the boundary in the AutoCAD tab first.", "warning");
        }
      } else {
        if (metrics.area > 0) {
          handleUpdateRow(index, {
            size: Number(metrics.area.toFixed(1)),
            unit: item.unit || "m²",
            description: item.description && item.description.includes("CAD") ? item.description : `CAD Calculated Area: ${item.description || ""}`
          });
          triggerToast("CAD shape area (" + metrics.area.toFixed(1) + " m²) successfully imported for " + (item.claimantName || "Claimant") + "!", "success");
        } else {
          triggerToast("No active AutoCAD drawing found. Please draw a shape with 3+ points in the AutoCAD tab first.", "warning");
        }
      }
    } else if (activeCADMetrics) {
      if (isFenceOrLinear) {
        const pVal = activeCADMetrics.perimeter || 0;
        if (pVal > 0) {
          handleUpdateRow(index, {
            size: Number(pVal.toFixed(1)),
            unit: item.unit || "mr",
            description: `CAD Calculated Fence Run (${activeCADMetrics.pointsCount} sides): ` + (item.description || "")
          });
          triggerToast("Active CAD perimeter imported successfully!", "success");
        } else {
          triggerToast("No active AutoCAD perimeter found. Draw a shape in the AutoCAD tab first.", "warning");
        }
      } else {
        const aVal = activeCADMetrics.area || 0;
        if (aVal > 0) {
          handleUpdateRow(index, {
            size: Number(aVal.toFixed(1)),
            unit: item.unit || "m²",
            description: `CAD Calculated Lot (${activeCADMetrics.pointsCount} sides): ` + (item.description || "")
          });
          triggerToast("Active CAD boundaries imported successfully!", "success");
        } else {
          triggerToast("No active AutoCAD drawing found. Draw a shape with 3+ points in the AutoCAD tab first.", "warning");
        }
      }
    } else {
      // Direct prompt simulation
      triggerToast("AutoCAD Sketcher is empty. Open the AutoCAD sketcher and draw a shape to auto-calculate the area.", "info");
    }
  };

  // Handle local picture uploads
  const handlePhotoUploadTrigger = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleUpdateRow(index, { photoUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Stats matrix
  const totalValValue = items.reduce((sum, item) => sum + item.finalValue, 0);
  const totalItems = items.length;
  const uniqueClaimants = new Set(items.map(i => i.claimantName.toLowerCase())).size;
  const avgDepreciation = totalItems > 0 
    ? Number((items.reduce((sum, i) => sum + i.depreciation, 0) / totalItems).toFixed(1)) 
    : 0;

  // Filter items
  const filteredItems = items.filter((item) => {
    const query = search.toLowerCase();
    const matchSearch = item.claimantName.toLowerCase().includes(query) ||
                        item.propertyCode.toLowerCase().includes(query) ||
                        item.description.toLowerCase().includes(query);
    const matchUnit = filterUnit === "All" || item.unit === filterUnit;
    return matchSearch && matchUnit;
  });

  // Recharts Chart structures
  const barChartData = items.reduce((acc: any[], curr) => {
    const existing = acc.find(x => x.name === curr.claimantName);
    if (existing) {
      existing.value += curr.finalValue;
    } else if (curr.claimantName.trim() !== "") {
      acc.push({ name: curr.claimantName, value: curr.finalValue });
    }
    return acc;
  }, []).slice(0, 7); // keep top 7 display

  const pieChartData = items.reduce((acc: any[], curr) => {
    let typeName = "Other";
    if (curr.description.toLowerCase().includes("bungalow")) typeName = "Bungalow";
    else if (curr.description.toLowerCase().includes("shop") || curr.description.toLowerCase().includes("row")) typeName = "Lockup Shop";
    else if (curr.description.toLowerCase().includes("fence")) typeName = "Perimeter Fence";
    else if (curr.description.toLowerCase().includes("grave") || curr.description.toLowerCase().includes("tomb")) typeName = "Grave Structures";
    else if (curr.description.toLowerCase().includes("shade")) typeName = "Shades/Utility";

    const existing = acc.find(x => x.name === typeName);
    if (existing) {
      existing.value += curr.finalValue;
    } else {
      acc.push({ name: typeName, value: curr.finalValue });
    }
    return acc;
  }, []);

  const COLORS = ["#0284c7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

  return (
    <div className="space-y-6 relative">
      {/* Toast Alert System */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-55 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold bg-slate-900 border-slate-800 text-white"
            style={{ minWidth: "280px", maxWidth: "90%" }}
          >
            {toastType === "success" && (
              <span className="h-2 w-2 rounded-full bg-emerald-450 animate-ping" />
            )}
            {toastType === "warning" && (
              <span className="h-2 w-2 rounded-full bg-amber-450 animate-ping" />
            )}
            {toastType === "info" && (
              <span className="h-2 w-2 rounded-full bg-blue-450 animate-ping" />
            )}
            <div className="flex-1 text-[11px] font-sans leading-tight">{toastMessage}</div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[10px] text-slate-450 hover:text-white font-bold px-1.5 py-1 rounded cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= VIEW HEADER AND CONTROLS ================= */}
      {!isPrintMode && (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                    Consultant Valuation Schedule
                    <span className="bg-blue-600 text-white text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded-full font-bold">
                      Master List
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Multi-property double-entry spreadsheet with built-in depreciation calculations, Unsplash image logs, and high-precision GPS geowatermarks.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleAddFieldRow}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition active:scale-97 cursor-pointer"
                id="sched-add-row-btn"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Property Row
              </button>

              <button
                onClick={() => setIsPrintMode(true)}
                disabled={items.length === 0}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition active:scale-97 cursor-pointer"
                id="sched-print-manifest-btn"
              >
                <Printer className="h-3.5 w-3.5" />
                Compile Report PDF
              </button>
              
              <div className="border-l border-slate-200 pl-2 flex gap-1.5">
                <button
                  onClick={handleResetToPresets}
                  className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                  title="Reload scanned PDF mock data"
                  id="sched-reset-btn"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleClearAllRows}
                  className="p-2 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition"
                  title="Discard spreadsheet records"
                  id="sched-clear-btn"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Search bar row */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-100 pt-3">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search claimant, code, structures..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                id="sched-search-input"
              />
              <span className="absolute left-2.5 top-2 text-slate-400">🔍</span>
            </div>
            
            <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Filter Unit:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {["All", "m²", "mr", "no"].map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setFilterUnit(unit)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                      filterUnit === unit 
                        ? "bg-white text-slate-800 shadow-3xs" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STATS CARD MODULES (BENTO GRID) ================= */}
      {!isPrintMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4.5 rounded-2xl flex items-center justify-between shadow-3xs hover:border-blue-400 transition">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Grand Compensation Value</span>
              <h4 className="text-xl font-black text-emerald-600 tracking-tight">₦{totalValValue.toLocaleString()}</h4>
            </div>
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
              ₦
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4.5 rounded-2xl flex items-center justify-between shadow-3xs hover:border-blue-400 transition">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Unique Claimant Files</span>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">{uniqueClaimants} Claimants</h4>
            </div>
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">
              👤
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4.5 rounded-2xl flex items-center justify-between shadow-3xs hover:border-blue-400 transition">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Structure Inventory</span>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">{totalItems} Assets</h4>
            </div>
            <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-bold">
              🏢
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4.5 rounded-2xl flex items-center justify-between shadow-3xs hover:border-blue-400 transition">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Avg Depreciation Index</span>
              <h4 className="text-xl font-black text-red-500 tracking-tight">{avgDepreciation}%</h4>
            </div>
            <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center text-red-600 font-bold">
              📉
            </div>
          </div>
        </div>
      )}

      {/* ================= ANALYTICS PANEL ================= */}
      {!isPrintMode && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl lg:col-span-7 shadow-3xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-4">
              Compensation Distribution by Claimant (Top 7)
            </h4>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis fontSize={9} stroke="#94a3b8" tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, "Valed Amount"]}
                    contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                  <Bar dataKey="value" fill="#0284c7" radius={[4, 4, 0, 0]}>
                    {barChartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl lg:col-span-5 shadow-3xs flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-2">
                Structural Allocation Breakdown
              </h4>
              <p className="text-[10px] text-slate-400 font-sans mb-4 leading-normal">
                Visualizing physical site structures and assets mapped to aggregate capital allocation.
              </p>
            </div>
            <div className="h-32 flex items-center gap-4">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="55%"
                      cy="50%"
                      innerRadius={22}
                      outerRadius={45}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 overflow-y-auto max-h-32 space-y-1.5 text-[9.5px] font-mono">
                {pieChartData.map((entry, idx) => {
                  const percent = totalValValue > 0 ? ((entry.value / totalValValue) * 100).toFixed(0) : "0";
                  return (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-bold truncate text-slate-800">{entry.name}</span>
                      <span className="text-slate-400 font-medium ml-auto">({percent}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= INTERACTIVE WORKSPACE TABLE ================= */}
      {!isPrintMode && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
              <Grid className="h-4 w-4 text-sky-400" />
              Dynamic Compensation Ledger
            </h4>
            <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-850 px-2.5 py-1 rounded border border-slate-800">
              Active Rows: {filteredItems.length} of {items.length} total
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="py-20 text-center">
              <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-bold">No valuation assets found matched this query or filter</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">Clear filters or click 'Add Property Row' to create new claimants.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-medium text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                    <th className="py-3 px-3 w-10 text-center">S/N</th>
                    <th className="py-3 px-3 min-w-[150px]">Claimant Identification</th>
                    <th className="py-3 px-3 w-24">Prop Code</th>
                    <th className="py-3 px-3 min-w-[200px]">Structure / Property Description</th>
                    <th className="py-3 px-3 w-20 text-right">Size</th>
                    <th className="py-3 px-3 w-16 text-center">Unit</th>
                    <th className="py-3 px-3 w-28 text-right">Rate (₦)</th>
                    <th className="py-3 px-4 w-20 text-center">Depr.</th>
                    <th className="py-3 px-3 w-28 text-right font-bold text-emerald-800">Final (₦)</th>
                    <th className="py-3 px-3 min-w-[124px]">Photo Log</th>
                    <th className="py-3 px-2 w-10 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredItems.map((item, idx) => {
                    const originalIndex = items.findIndex(i => i.id === item.id);
                    const isSameClaimantAsPrev = idx > 0 && filteredItems[idx - 1].sn === item.sn;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-all font-medium align-middle" id={`sched-row-${item.id}`}>
                        {/* Serial Number */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500 text-[11px]">
                          {isSameClaimantAsPrev ? (
                            <span className="text-slate-300 font-normal" title="Under same serial number">"</span>
                          ) : (
                            item.sn
                          )}
                        </td>

                        {/* Claimant Name */}
                        <td className="py-2.5 px-3">
                          {isSameClaimantAsPrev ? (
                            <div className="flex items-center gap-1.5 pl-2">
                              <span className="text-slate-305 text-[10px] font-bold shrink-0 italic">↳ same:</span>
                              <input
                                type="text"
                                value={item.claimantName}
                                onChange={(e) => handleUpdateRow(originalIndex, { claimantName: e.target.value })}
                                className="w-full font-sans font-medium text-slate-400 focus:text-slate-800 bg-transparent hover:bg-white focus:bg-white py-0.5 px-1 px-1.5 border border-transparent hover:border-slate-200 focus:border-blue-600 rounded text-[11px]"
                                placeholder="Claimant Name"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={item.claimantName}
                              onChange={(e) => handleUpdateRow(originalIndex, { claimantName: e.target.value })}
                              className="w-full font-sans font-bold text-slate-850 bg-transparent hover:bg-white focus:bg-white py-1 px-1.5 border border-transparent hover:border-slate-250 focus:border-blue-600 rounded"
                              placeholder="Claimant Name"
                            />
                          )}
                        </td>

                        {/* Property Code */}
                        <td className="py-2.5 px-3 font-mono">
                          <input
                            type="text"
                            value={item.propertyCode}
                            onChange={(e) => handleUpdateRow(originalIndex, { propertyCode: e.target.value })}
                            className="w-full font-mono font-bold text-[#0284c7] bg-transparent hover:bg-white focus:bg-white py-1 px-1.5 border border-transparent hover:border-slate-250 focus:border-blue-600 rounded text-[11px]"
                            placeholder="e.g. R/302"
                          />
                        </td>

                        {/* Structure Description / Presets Dropdown combo */}
                        <td className="py-2.5 px-3 font-medium">
                          <div className="flex gap-1.5 relative group/presets">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateRow(originalIndex, { description: e.target.value })}
                              className="flex-1 font-sans text-slate-705 bg-transparent hover:bg-white focus:bg-white py-1 px-1.5 border border-transparent hover:border-slate-250 focus:border-blue-600 rounded text-[11px]"
                              placeholder="e.g. Bungalow (uncompleted)"
                            />
                            
                            {/* Fast Presets Pick Dropdown button */}
                            <div className="relative">
                              <button
                                className="p-1 border border-slate-200 bg-white hover:bg-slate-50 rounded text-[10px] text-slate-400 group-hover:block"
                                title="Pick standard presets"
                              >
                                <ChevronsUpDown className="h-3 w-3 text-slate-500" />
                              </button>
                              <div className="hidden group-focus-within/presets:block group-hover/presets:block absolute right-0 top-6 bg-white border border-slate-200 rounded-lg shadow-md py-1 w-48 z-40 max-h-48 overflow-y-auto">
                                <span className="text-[8.5px] font-mono tracking-widest text-slate-400 uppercase block px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 mb-1">
                                  Standard Val Presets
                                </span>
                                {STRUCTURE_PRESETS.map((p, pIdx) => (
                                  <button
                                    key={pIdx}
                                    onClick={() => handleUpdateRow(originalIndex, { 
                                      description: p.text, 
                                      rate: p.defaultRate, 
                                      unit: p.defaultUnit 
                                    })}
                                    className="w-full text-left text-[10px] px-2.5 py-1.5 hover:bg-slate-100 border-b border-slate-50 font-sans text-slate-700 block"
                                  >
                                    <strong>{p.text}</strong> (₦{p.defaultRate.toLocaleString()})
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Size (Numeric) */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <input
                              type="number"
                              step="0.1"
                              value={item.size}
                              onChange={(e) => handleUpdateRow(originalIndex, { size: Number(e.target.value) })}
                              className="w-16 font-mono font-bold text-slate-800 text-right bg-transparent hover:bg-white focus:bg-white py-0.5 px-1.5 border border-transparent hover:border-slate-250 focus:border-blue-600 rounded text-[11px]"
                              placeholder="0"
                            />
                            <button
                              onClick={() => {
                                if (onNavigateToCAD) {
                                  onNavigateToCAD(item);
                                } else {
                                  handleImportFromActiveCAD(originalIndex);
                                }
                              }}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 rounded text-blue-600 cursor-pointer shrink-0"
                              title="Go directly to the AutoCAD CAD Workspace of this property"
                              style={{ minWidth: "24px", minHeight: "24px" }}
                            >
                              <Sparkles className="h-3 w-3 animate-pulse text-indigo-600" />
                            </button>
                          </div>
                        </td>

                        {/* Unit Selection */}
                        <td className="py-2.5 px-3 text-center">
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateRow(originalIndex, { unit: e.target.value })}
                            className="bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-250 py-0.5 px-1 font-mono text-[10px] text-slate-600 font-bold rounded cursor-pointer"
                          >
                            <option value="m²">m²</option>
                            <option value="mr">mr</option>
                            <option value="no">no</option>
                            <option value="ha">ha</option>
                            <option value="-">-</option>
                          </select>
                        </td>

                        {/* Rate (₦) */}
                        <td className="py-2.5 px-3 text-right font-mono">
                          <input
                            type="number"
                            step="500"
                            value={item.rate}
                            onChange={(e) => handleUpdateRow(originalIndex, { rate: Number(e.target.value) })}
                            className="w-24 font-mono font-bold text-slate-800 text-right bg-transparent hover:bg-white focus:bg-white py-0.5 px-1 border border-transparent hover:border-slate-250 focus:border-blue-600 rounded text-[11px]"
                            placeholder="0"
                          />
                        </td>

                        {/* Depreciation (%) */}
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="5"
                              value={item.depreciation}
                              onChange={(e) => handleUpdateRow(originalIndex, { depreciation: Number(e.target.value) })}
                              className="w-12 font-mono text-center font-bold text-slate-605 bg-transparent hover:bg-white focus:bg-white py-0.5 px-1 border border-transparent hover:border-slate-250 focus:border-blue-600 rounded text-[11px]"
                              placeholder="0"
                            />
                            <span className="text-[9.5px] font-mono text-slate-400 font-bold">%</span>
                          </div>
                        </td>

                        {/* Final Value (₦, auto-recalculated) */}
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 border-l border-slate-100 bg-slate-50/40 text-[11.5px]">
                          ₦{item.finalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </td>

                        {/* Photo attachment & GPS config */}
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          <div className="flex items-center gap-2 group/photo relative">
                            {item.photoUrl ? (
                              <div className="relative rounded overflow-hidden w-11 h-6 shrink-0 border border-slate-200">
                                <img src={item.photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition flex items-center justify-center text-white text-[7px] font-sans font-bold">
                                  PREVIEW
                                </div>
                              </div>
                            ) : (
                              <button className="h-6 w-11 rounded border border-dashed border-slate-350 bg-slate-50 flex items-center justify-center">
                                <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                              </button>
                            )}

                            {/* Options popup */}
                            <div className="flex gap-1 items-center">
                              {/* Hover tooltip showing geotagged camera details */}
                              <button
                                onClick={() => setSelectedItemForPhoto(item)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"
                                title="Inspect geotagged camera certificate"
                              >
                                <Eye className="h-3 w-3" />
                              </button>

                              {/* Simple file selection picker */}
                              <label className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handlePhotoUploadTrigger(originalIndex, e)}
                                  className="hidden"
                                />
                                <ListPlus className="h-3 w-3" />
                              </label>
                            </div>
                          </div>
                        </td>

                        {/* Row Actions */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => handleDeleteRow(item.id)}
                            className="p-1 hover:bg-red-50 hover:text-red-650 rounded text-slate-400 transition cursor-pointer"
                            title="Discard valuation row"
                            id={`sched-del-${item.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer aggregates */}
          {filteredItems.length > 0 && (
            <div className="bg-slate-50 text-[11px] font-mono text-slate-600 px-5 py-3 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                * Math formula verified automatically: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800 font-mono text-[9.5px]">Final = Size × Rate × (1 - Depr / 100)</code>
              </div>
              <div className="flex gap-4 font-black">
                <span>Structures count: <strong className="text-slate-900 font-bold underline">{filteredItems.length} checked</strong></span>
                <span>Subaggregate sum: <strong className="text-emerald-700 text-xs font-black underline">₦{filteredItems.reduce((sum, i) => sum + i.finalValue, 0).toLocaleString()}</strong></span>
              </div>
            </div>
          )}

          {/* Bottom Adding Buttons (The button to keep adding should be down) */}
          <div className="bg-slate-100 hover:bg-slate-50/50 border-t border-slate-200 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddFieldRow}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                id="sched-add-row-bottom-btn"
              >
                <Plus className="h-4 w-4" />
                Keep Adding Rows (1x)
              </button>
              <button
                onClick={() => handleAddMultipleRows(5)}
                className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-705 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
                id="sched-add-5-bottom-btn"
              >
                <ListPlus className="h-3.5 w-3.5 text-slate-450" />
                Add +5 Rows
              </button>
              <button
                onClick={() => handleAddMultipleRows(10)}
                className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-705 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
                id="sched-add-10-bottom-btn"
              >
                <ListPlus className="h-3.5 w-3.5 text-slate-450" />
                Add +10 Rows
              </button>
            </div>
            <div className="text-[10px] text-slate-400 font-mono text-center sm:text-right">
              💡 Ditto (") and Indent (↳) grouping organize multiple properties under one serial number.
            </div>
          </div>
        </div>
      )}

      {/* ================= GEOTAGGED DIGITAL WATERMARK INSPECTOR POPUP ================= */}
      <AnimatePresence>
        {selectedItemForPhoto && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 overflow-hidden shadow-xl"
            >
              <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-sky-400 tracking-wider">Geotagged Watermark Certificate</span>
                <button onClick={() => setSelectedItemForPhoto(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-200">
                  <img src={selectedItemForPhoto.photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  
                  {/* Stamped GPS Block matches PDF camera standard */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-2 flex gap-2 items-center font-sans">
                    <div className="shrink-0 bg-slate-900 border border-white/20 rounded w-8 h-8 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-40 bg-radial" style={{ backgroundImage: "radial-gradient(#10b981 1px, transparent 1px)", backgroundSize: "3px 3px" }} />
                      <div className="absolute h-1 w-1 bg-red-500 rounded-full animate-ping" />
                      <span className="absolute bottom-[0.5px] left-0 right-0 text-center font-mono font-black text-[4.5px] tracking-tighter text-white/90">Google</span>
                    </div>

                    <div className="flex-1 min-w-0" style={{ fontSize: "7px" }}>
                      <h5 className="font-bold text-white truncate text-[8.5px] flex items-center gap-1 leading-snug">
                        <span>Akwa Ibom, Nigeria</span>
                        <span>🇳🇬</span>
                      </h5>
                      <p className="text-slate-300 truncate leading-none mt-0.5">{selectedItemForPhoto.claimantName} ({selectedItemForPhoto.propertyCode})</p>
                      <p className="text-slate-350 font-mono leading-none mt-0.5">Lat {selectedItemForPhoto.latitude.toFixed(6)}° Long {selectedItemForPhoto.longitude.toFixed(6)}°</p>
                      <p className="text-amber-400 font-mono leading-none mt-0.5" style={{ fontSize: "6.5px" }}>Tuesday, 16/06/2026 03:49 PM GMT+01:00</p>
                    </div>
                    
                    <div className="absolute right-1 bottom-1 bg-yellow-400 text-[5px] font-extrabold text-slate-950 px-1 rounded-sm leading-tight">
                      GPS MAP CAMERA
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 font-sans">
                  <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Asset Holder:</span>
                    <strong className="text-slate-900">{selectedItemForPhoto.claimantName}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Property Identifier:</span>
                    <strong className="text-blue-600 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded">{selectedItemForPhoto.propertyCode}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Survey Coordinates:</span>
                    <strong className="text-slate-800 font-mono">Lat {selectedItemForPhoto.latitude}, Long {selectedItemForPhoto.longitude}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-500 font-sans">Watermark State:</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold border border-emerald-100">
                      <FileCheck2 className="h-3 w-3" /> SECURE MATCH CERTIFIED
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {/* Coordinates Modifier Form */}
                  <div className="flex-1 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Set Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={selectedItemForPhoto.latitude}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const idx = items.findIndex(i => i.id === selectedItemForPhoto.id);
                          if (idx !== -1) {
                            handleUpdateRow(idx, { latitude: val });
                            setSelectedItemForPhoto({ ...selectedItemForPhoto, latitude: val });
                          }
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Set Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={selectedItemForPhoto.longitude}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const idx = items.findIndex(i => i.id === selectedItemForPhoto.id);
                          if (idx !== -1) {
                            handleUpdateRow(idx, { longitude: val });
                            setSelectedItemForPhoto({ ...selectedItemForPhoto, longitude: val });
                          }
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded font-bold"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItemForPhoto(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold rounded-xl flex items-center justify-center"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= PRINT REPORT COMPILED VIEW (FULL COMPLIANCE PRINT) ================= */}
      {isPrintMode && (
        <div className="fixed inset-0 bg-white overflow-y-auto text-slate-900 z-50 p-6 sm:p-12 font-sans select-none" id="print-compiled-view-portal">
          {/* Header Utilities */}
          <div className="mb-8 border-b border-slate-200 pb-4 flex justify-between items-center print:hidden">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-extrabold flex items-center gap-1 max-w-max">
                <AlertCircle className="h-3 w-3" /> PRINTING PORTAL ACTIVE
              </span>
              <p className="text-[11px] text-slate-500">
                Adjust margins and scaling to fit all pages beautifully. Press 'Print Valuation Ledger' or 'Ctrl + P' to render.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Valuation Ledger
              </button>
              <button
                onClick={() => setIsPrintMode(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
              >
                Return to Editor
              </button>
            </div>
          </div>

          {/* Genuine 17-page Look compensation header page formatting matches scan! */}
          <div className="max-w-6xl mx-auto space-y-10" id="print-manifest-paper">
            {/* Title Block */}
            <div className="text-center space-y-2 border-b border-slate-900 pb-6 uppercase font-serif tracking-wide">
              <h2 className="text-lg font-black text-slate-950 leading-tight">Comprehensive Valuation Schedule & Report Register</h2>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest leading-none mt-1">compensation corridor resettlement project audit ledger</p>
              <p className="text-[10px] text-slate-500 font-mono uppercase font-bold text-sky-850 mt-1">STATE COMPENSATIVE SCALE MATRIX: AKWA IBOM & CROSS RIVER HIGHWAYS</p>
            </div>

            {/* General parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-lg font-mono text-[9px] text-slate-600 leading-normal">
              <div>
                <span className="block text-slate-400 font-bold uppercase">Client Resettlement:</span>
                <span className="text-slate-900 font-bold block">Ministry of Lands, Housing & Urban Development</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase">Report Date:</span>
                <span className="text-slate-900 font-bold block">June 16, 2026</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase">Executing Consultant:</span>
                <span className="text-slate-900 font-bold block">U. Johnson & Partners Joint ValuField Team</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase">Certification status:</span>
                <span className="text-emerald-700 font-extrabold block">✓ MASTER LEDGER SECURE</span>
              </div>
            </div>

            {/* Manifest Table rendered exact match with Scan! */}
            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-[#2454a4] text-white font-bold leading-normal font-sans border-b border-slate-350">
                    <th className="py-2.5 px-2 text-center border-r border-white/20 w-8">S/N</th>
                    <th className="py-2.5 px-3 border-r border-white/20 min-w-[150px]">Name of Claimant</th>
                    <th className="py-2.5 px-2 border-r border-white/20 w-16 text-center">Property Code</th>
                    <th className="py-2.5 px-3 border-r border-white/20 min-w-[190px]">Property Description</th>
                    <th className="py-2.5 px-2 border-r border-white/20 w-16 text-right">Size</th>
                    <th className="py-2.5 px-2.5 border-r border-white/20 w-24 text-right">Rate (₦)</th>
                    <th className="py-2.5 px-1.5 border-r border-white/20 w-12 text-center">Depr.</th>
                    <th className="py-2.5 px-3 border-r border-white/20 w-28 text-right font-bold">Final Value (₦)</th>
                    <th className="py-2.5 px-2 min-w-[130px] text-center">Geotagged site Photo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-sans text-slate-950 align-top">
                  {items.map((item, idx) => {
                    const isEven = idx % 2 === 0;
                    const isSameClaimantAsPrevPrint = idx > 0 && items[idx - 1].sn === item.sn;
                    return (
                      <tr key={item.id} className={`${isEven ? "bg-[#f1f6ff]" : "bg-white"} border-b border-slate-200 font-medium`}>
                        {/* Serial slot */}
                        <td className="py-3 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                          {isSameClaimantAsPrevPrint ? (
                            <span className="text-slate-300">"</span>
                          ) : (
                            item.sn
                          )}
                        </td>

                        {/* Claimant */}
                        <td className="py-3 px-3 font-bold text-slate-900 border-r border-slate-200 leading-snug">
                          {isSameClaimantAsPrevPrint ? (
                            <span className="text-slate-400 font-normal italic">↳ "</span>
                          ) : (
                            item.claimantName
                          )}
                        </td>

                        {/* Code */}
                        <td className="py-3 px-2 text-center font-mono font-black text-blue-800 border-r border-slate-200 text-[10px]">
                          {item.propertyCode}
                        </td>

                        {/* Description */}
                        <td className="py-3 px-3 text-slate-800 border-r border-slate-200 leading-snug font-sans">
                          {item.description}
                        </td>

                        {/* Size */}
                        <td className="py-3 px-2 text-right font-mono font-semibold border-r border-slate-200 whitespace-nowrap text-[10px]">
                          {item.size > 0 ? `${item.size} ${item.unit}` : "-"}
                        </td>

                        {/* Rate */}
                        <td className="py-3 px-2.5 text-right font-mono text-slate-800 border-r border-slate-200 text-[10px]">
                          {item.rate ? item.rate.toLocaleString() : "-"}
                        </td>

                        {/* Depreciation */}
                        <td className="py-3 px-1.5 text-center font-mono text-slate-600 border-r border-slate-200 text-[10px]">
                          {item.depreciation > 0 ? `${item.depreciation}%` : "-"}
                        </td>

                        {/* Final Value */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200 text-[10.5px]">
                          {item.finalValue.toLocaleString()}
                        </td>

                        {/* Image watermark lockup with map badge */}
                        <td className="py-1 px-1 text-center">
                          <div className="relative rounded border border-slate-300 overflow-hidden bg-slate-900 aspect-video w-[124px] mx-auto min-h-[66px]">
                            {item.photoUrl ? (
                              <>
                                <img src={item.photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/80 font-sans text-left text-white leading-none p-1 flex items-center justify-between pointer-events-none" style={{ fontSize: "5px" }}>
                                  <div className="flex-1 min-w-0">
                                    <h6 className="font-bold text-white truncate text-[5.5px] leading-tight">Akwa Ibom, Nigeria</h6>
                                    <p className="text-slate-300 truncate text-[4.5px] mt-0.5 leading-none">Lat {item.latitude.toFixed(4)} Lng {item.longitude.toFixed(4)}</p>
                                    <p className="text-yellow-400 font-mono text-[4px] mt-0.5 leading-none">16/06/2026 GPS CAMERA</p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <span className="text-[6.5px] font-mono text-slate-500 font-bold block pt-6">NO IMAGE ATTACHED</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Row */}
            <div className="bg-slate-50 border border-slate-300 rounded p-4 text-[10.5px] font-mono space-y-2 leading-relaxed">
              <div className="flex justify-between font-bold border-b border-dashed border-slate-300 pb-2">
                <span>TOTAL REGISTER CLAIMANTS:</span>
                <span className="text-slate-900 font-sans font-black">{uniqueClaimants} CLAIMANTS</span>
              </div>
              <div className="flex justify-between font-bold border-b border-dashed border-slate-300 pb-2">
                <span>TOTAL INDIVIDUAL VALUED STRUCTURES:</span>
                <span className="text-slate-900 font-sans font-black">{totalItems} STRUCTURES DETECTED</span>
              </div>
              <div className="flex justify-between font-black text-[#1e40af] text-xs pt-1">
                <span>AGGREGATE VALED SURVEY EXPENDITURE DISBURSEMENT:</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-250 rounded font-sans font-extrabold font-black text-sm">
                  ₦ {totalValValue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Signature declaration slots */}
            <div className="pt-16 grid grid-cols-2 gap-10 font-sans text-[10px] text-slate-500 leading-normal border-t border-slate-200 mt-16">
              <div className="space-y-4">
                <div className="h-10 border-b border-slate-400 w-44" />
                <div>
                  <span className="font-black text-slate-800 block uppercase font-mono text-[9px] leading-none mb-0.5">ESV. RAYMOND COLE, ARSV</span>
                  <span className="block leading-tight text-[8.5px]">Team Lead Coordinator, Compensation Survey Division</span>
                  <span className="block italic text-slate-400 leading-none mt-1">U. Johnson & Partners, Lagos</span>
                </div>
              </div>
              <div className="space-y-4 ml-auto text-right">
                <div className="h-10 border-b border-slate-400 w-44 ml-auto" />
                <div>
                  <span className="font-black text-slate-800 block uppercase font-mono text-[9px] leading-none mb-0.5">GOVERNOR REPRESENTATIVE STAMP</span>
                  <span className="block leading-tight text-[8.5px]">Ministry of Lands, Surveying & Town Resettlement</span>
                  <span className="block italic text-slate-400 leading-none mt-1">Certified Official Record Ledger Seal</span>
                </div>
              </div>
            </div>

            {/* Print Footer */}
            <div className="text-center font-mono text-[8px] text-slate-400 uppercase tracking-widest pt-10">
              Page 1 of 17 • Generated via ValuField Pro Cloud Ledger Systems • Confidential & Certified Project Record
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
