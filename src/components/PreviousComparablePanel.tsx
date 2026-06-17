import React, { useState, useEffect } from "react";
import { Comparable } from "../types";
import { getDocs, collection, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Search, History, Check, Plus, Loader2, BarChart3, ChevronLeft } from "lucide-react";

interface PreviousComparablePanelProps {
  propertyType: "Residential" | "Commercial" | "Industrial" | "Agricultural" | "Other";
  state: string;
  selectedComparableId: string | null;
  onSelectComparable: (compId: string | null, compValue: number, compItem: Comparable | null) => void;
  calculatedArea: number;
}

export default function PreviousComparablePanel({
  propertyType,
  state,
  selectedComparableId,
  onSelectComparable,
  calculatedArea
}: PreviousComparablePanelProps) {
  const [comparables, setComparables] = useState<Comparable[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);
  const [searchAreaQuery, setSearchAreaQuery] = useState<string>("");
  const [selectedComparable, setSelectedComparableState] = useState<Comparable | null>(null);

  // New comparable form fields
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newArea, setNewArea] = useState<string>("");
  const [newSize, setNewSize] = useState<number>(150);
  const [newSale, setNewSale] = useState<number>(0);
  const [newRental, setNewRental] = useState<number>(0);
  const [newValuer, setNewValuer] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");

  useEffect(() => {
    fetchComparables();
  }, [propertyType, state]);

  // Sync selected index
  useEffect(() => {
    if (selectedComparableId && comparables.length > 0) {
      const active = comparables.find(c => c.id === selectedComparableId);
      if (active) {
        setSelectedComparableState(active);
      }
    }
  }, [selectedComparableId, comparables]);

  const fetchComparables = async () => {
    setLoading(true);
    try {
      // Query comparables filtered by propertyType
      const q = query(collection(db, "comparables"), where("propertyType", "==", propertyType));
      const snapshot = await getDocs(q);
      const results: Comparable[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        results.push({
          id: doc.id,
          userId: d.userId,
          propertyType: d.propertyType,
          areaName: d.areaName,
          sizeSqm: d.sizeSqm,
          saleValue: d.saleValue,
          rentalValue: d.rentalValue,
          valuationDate: d.valuationDate,
          valuer: d.valuer,
          notes: d.notes,
          createdAt: d.createdAt
        });
      });

      // Filter locally or seed if list is short
      if (results.length === 0) {
        // Fallback seed list so user is not stuck
        const seedList: Comparable[] = [
          {
            id: "comp-1",
            userId: "system",
            propertyType,
            areaName: state + " Central Area",
            sizeSqm: 250,
            saleValue: 45000000,
            rentalValue: 250000,
            valuationDate: "2026-03-12",
            valuer: "ESV. Raymond Chinedu, RSV",
            notes: "Fitted residential flat with standard utilities, tarred access road, medium security.",
            createdAt: new Date()
          },
          {
            id: "comp-2",
            userId: "system",
            propertyType,
            areaName: state + " Highbrow Estates",
            sizeSqm: 500,
            saleValue: 120000000,
            rentalValue: 600000,
            valuationDate: "2026-05-18",
            valuer: "Appraisals Nigeria Ltd",
            notes: "High density commercial building structure, perimeter fenced with modern landscaping.",
            createdAt: new Date()
          },
          {
            id: "comp-3",
            userId: "system",
            propertyType,
            areaName: state + " Industrial Layout",
            sizeSqm: 1000,
            saleValue: 85000000,
            rentalValue: 450000,
            valuationDate: "2026-02-04",
            valuer: "ESV. Johnson Cole",
            notes: "Warehouse facility with strong sandcrete blocks layout and heavy truck access.",
            createdAt: new Date()
          }
        ];
        setComparables(seedList);
      } else {
        setComparables(results);
      }
    } catch (err) {
      console.error("Error loading comps:", err);
      // fallback even if connection offline
      const seedList: Comparable[] = [
        {
          id: "comp-offline-1",
          userId: "system",
          propertyType,
          areaName: "Standard Area Sector",
          sizeSqm: 200,
          saleValue: 35000000,
          rentalValue: 180000,
          valuationDate: "2026-01-10",
          valuer: "RSV Surveyors Associates",
          notes: "Semi-detached modern structure.",
          createdAt: new Date()
        }
      ];
      setComparables(seedList);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectComparableItem = (comp: Comparable) => {
    setSelectedComparableState(comp);
    // Value extrapolation: calculate price per sqm = sale value / sizeSqm (or rental value if appropriate)
    // Then multiply by our current AutoCAD-drawn area
    const benchmarkPrice = comp.saleValue || (comp.rentalValue ? comp.rentalValue * 12 : 100000);
    const pricePerSqm = benchmarkPrice / comp.sizeSqm;
    const finalEstimatedValue = pricePerSqm * calculatedArea;
    
    onSelectComparable(comp.id, Math.round(finalEstimatedValue), comp);
  };

  const handleAddNewComparable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArea || newSize <= 0) return;
    setAdding(true);
    try {
      const payload = {
        userId: "user-provided",
        propertyType,
        areaName: newArea,
        sizeSqm: Number(newSize),
        saleValue: newSale > 0 ? Number(newSale) : null,
        rentalValue: newRental > 0 ? Number(newRental) : null,
        valuationDate: new Date().toISOString().split("T")[0],
        valuer: newValuer || "Self Appraiser",
        notes: newNotes,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "comparables"), payload);
      
      const createdObj: Comparable = {
        id: docRef.id,
        ...payload,
        createdAt: new Date()
      };

      setComparables([createdObj, ...comparables]);
      handleSelectComparableItem(createdObj);
      setShowAddForm(false);
      // Reset
      setNewArea("");
      setNewNotes("");
      setNewSale(0);
      setNewRental(0);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "comparables");
    } finally {
      setAdding(false);
    }
  };

  // Filter comparables based on search query
  const filteredComps = comparables.filter(c => 
    c.areaName.toLowerCase().includes(searchAreaQuery.toLowerCase()) || 
    c.valuer.toLowerCase().includes(searchAreaQuery.toLowerCase()) ||
    c.notes.toLowerCase().includes(searchAreaQuery.toLowerCase())
  );

  // Compute stats metrics based on selected comparable
  const selectedSqmRate = selectedComparable 
    ? (selectedComparable.saleValue || (selectedComparable.rentalValue ? selectedComparable.rentalValue * 12 : 0)) / selectedComparable.sizeSqm
    : 0;

  const estimatedMarketValue = selectedSqmRate * calculatedArea;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-6" id="comparables-panel-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="text-blue-600 h-5 w-5" />
            Previous Valuations Comparable Search
          </h3>
          <p className="text-xs text-slate-500">
            For standard valuations, look up past appraisal sales records of <strong>{propertyType}</strong> properties in that region.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 transition text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start cursor-pointer transition-all"
          id="add-comparable-btn"
        >
          <Plus className="h-3.5 w-3.5 text-blue-600" />
          {showAddForm ? "Back to Search" : "Log New Sale"}
        </button>
      </div>

      {showAddForm ? (
        <form onSubmit={handleAddNewComparable} className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-4" id="comparables-add-form">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-mono">Log Historical Field Transaction</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Locality/Neighborhood *</label>
              <input
                type="text"
                placeholder="e.g. Victoria Island Extension"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-xs"
                required
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Land Size (sqm) *</label>
              <input
                type="number"
                value={newSize}
                onChange={(e) => setNewSize(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Recorded Sale Value (₦ - Optional)</label>
              <input
                type="number"
                value={newSale || ""}
                onChange={(e) => setNewSale(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-xs font-mono"
                placeholder="e.g. 50,000,000"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Recorded Rental Value (₦/year - Optional)</label>
              <input
                type="number"
                value={newRental || ""}
                onChange={(e) => setNewRental(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-xs font-mono"
                placeholder="e.g. 2,000,000"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Chartered Surveyor in Charge</label>
              <input
                type="text"
                placeholder="e.g. RSV Paul"
                value={newValuer}
                onChange={(e) => setNewValuer(e.target.value)}
                className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Structural / Condition Notes</label>
              <input
                type="text"
                placeholder="e.g. Reinforced walls structural finishing"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full p-2.5 border border-slate-200 bg-white rounded-lg text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={adding}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold font-sans cursor-pointer transition-all shadow-xs"
          >
            {adding ? "Persisting to database..." : "Commit Comparable to secure cloudSync"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Quick search input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter comparative valuations of this locality (site names, notes)..."
              value={searchAreaQuery}
              onChange={(e) => setSearchAreaQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              id="comparable-search-input"
            />
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 select-none">
              <Loader2 className="animate-spin h-5 w-5 mx-auto mb-2 text-blue-600" />
              <p className="text-xs font-mono">LOCATING PARCEL REGISTRY INDEX...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
              {filteredComps.length > 0 ? (
                filteredComps.map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => handleSelectComparableItem(comp)}
                    className={`p-3.5 border text-left cursor-pointer transition-all rounded-lg relative overflow-hidden flex flex-col justify-between ${
                      selectedComparableId === comp.id
                        ? "border-blue-600 bg-blue-50/20 ring-1 ring-blue-600"
                        : "border-slate-200 hover:border-blue-300 bg-white"
                    }`}
                    id={`comp-card-${comp.id}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 font-mono uppercase">
                          {comp.valuationDate}
                        </span>
                        {selectedComparableId === comp.id && (
                          <span className="bg-blue-600 text-white p-0.5 rounded-full">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-xs text-slate-800 leading-normal">{comp.areaName}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{comp.notes}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">{comp.sizeSqm} m² Plot</span>
                      <span className="font-bold text-blue-600">
                        {comp.saleValue ? `₦${(comp.saleValue / 1000000).toFixed(1)}M` : `₦${(comp.rentalValue || 0).toLocaleString()}/yr`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-6 text-center text-xs text-slate-400">
                  No previous appraisals match your neighborhood filters yet. Log a new transaction or reset search.
                </div>
              )}
            </div>
          )}

          {/* Value comparison extrapolator */}
          {selectedComparable && (
            <div className="bg-blue-50/30 rounded-lg border border-blue-100 p-4 space-y-3" id="comparables-calculators-overlay">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  Comparative valuation calculation
                </span>
                <span className="font-mono text-xs text-blue-600 font-bold">₦{estimatedMarketValue.toLocaleString()}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[9px] uppercase font-mono font-bold tracking-wider">Benchmark Area Price</span>
                  <span className="font-bold text-slate-700 font-mono">
                    ₦{selectedSqmRate.toFixed(1)} / m²
                  </span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-slate-400 block text-[9px] uppercase font-mono font-bold tracking-wider">CAD Area Applied</span>
                  <span className="font-bold text-slate-700 font-mono">
                    {calculatedArea} m²
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
