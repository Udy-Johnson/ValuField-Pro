import React from "react";
import { Property } from "../types";
import { Home, Building2, MapPin, ClipboardList, Calendar, User, Compass } from "lucide-react";

interface PropertyDetailsFormProps {
  property: Partial<Property>;
  onChangeProperty: (updates: Partial<Property>) => void;
  onGetCurrentGPS: () => void;
  gpsStatus: "idle" | "loading" | "success" | "error";
}

const PROPERTY_TYPES = ["Residential", "Commercial", "Industrial", "Agricultural", "Other"];
const STATES_LIST = [
  "Akwa Ibom", "Lagos", "Abuja FCT", "Rivers", "Kano", "Ogun", "Oyo", "Delta", 
  "California", "Texas", "New York", "Florida", "Ontario", "London"
];

export default function PropertyDetailsForm({
  property,
  onChangeProperty,
  onGetCurrentGPS,
  gpsStatus
}: PropertyDetailsFormProps) {
  
  const handleFieldChange = (field: keyof Property, value: any) => {
    onChangeProperty({ [field]: value });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-6" id="property-details-form-card">
      <div>
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="text-blue-600 h-5 w-5" />
          Field Property Info & Notes
        </h3>
        <p className="text-xs text-slate-500">
          Capture subject details, surveyor identifier, and localized context.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name input */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
            Property Reference Name *
          </label>
          <div className="relative">
            <Home className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Plot 4B, Lekki Phase 1 Residential Complex"
              value={property.name || ""}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
              required
              id="property-name-field"
            />
          </div>
        </div>

        {/* Valuer name */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
            Lead Appraiser / Surveyor Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Arc. Johnson Paul, RSV, ANIVS"
              value={property.valuerName || ""}
              onChange={(e) => handleFieldChange("valuerName", e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
              id="property-valuer-field"
            />
          </div>
        </div>

        {/* Owner name */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
            Property Owner / Claimant Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Chief Aliyu O. Akpan"
              value={property.ownerName || ""}
              onChange={(e) => handleFieldChange("ownerName", e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
              id="property-owner-field"
            />
          </div>
        </div>

        {/* Physical Address */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
            Physical Address Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Block 12, Admiralty Way, Lekki, Lagos State, Nigeria"
              value={property.address || ""}
              onChange={(e) => handleFieldChange("address", e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
              id="property-address-field"
            />
          </div>
        </div>

        {/* Valuation Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
            Inspection / Survey Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={property.inspectionDate || ""}
              onChange={(e) => handleFieldChange("inspectionDate", e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
              id="property-date-field"
            />
          </div>
        </div>

        {/* Property Category */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
            Property Typology
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <select
              value={property.propertyType || "Residential"}
              onChange={(e) => handleFieldChange("propertyType", e.target.value as any)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-white rounded-lg text-sm appearance-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
              id="property-type-select"
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Valuation Mandate Purpose */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
            Valuation Mandate Purpose
          </label>
          <div className="relative">
            <ClipboardList className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <select
              value={property.valuationPurpose || "market"}
              onChange={(e) => handleFieldChange("valuationPurpose", e.target.value as any)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-white rounded-lg text-sm appearance-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
              id="valuation-purpose-select"
            >
              <option value="market">Market Open Market Valuation</option>
              <option value="compensation">Statutory Compensation Valuation</option>
              <option value="rental">Rental Income / Leasable Value</option>
              <option value="other">Asset / Mortgage Assessment</option>
            </select>
          </div>
        </div>

        {/* State of Jurisdiction */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
            State / Region Jurisdiction
          </label>
          <div className="relative">
            <Compass className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <select
              value={property.state || "Lagos"}
              onChange={(e) => handleFieldChange("state", e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-white rounded-lg text-sm appearance-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
              id="property-state-select"
            >
              {STATES_LIST.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* GPS Capture Pinning Tool */}
        <div className="md:col-span-2 border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-700 block">GPS Coordinates Pinning</span>
            <div className="flex gap-4 font-mono text-xs text-slate-500">
              <span>Latitude: {property.latitude !== null ? property.latitude?.toFixed(6) : "Not captured"}</span>
              <span>Longitude: {property.longitude !== null ? property.longitude?.toFixed(6) : "Not captured"}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onGetCurrentGPS}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-white cursor-pointer ${
              gpsStatus === "loading"
                ? "bg-slate-400 cursor-not-allowed"
                : gpsStatus === "success"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-blue-600 hover:bg-blue-700 shadow-xs"
            }`}
            id="gps-pin-trigger-btn"
          >
            <Compass className={`h-4 w-4 ${gpsStatus === "loading" ? "animate-spin" : ""}`} />
            {gpsStatus === "loading"
              ? "Positioning Satellites..."
              : gpsStatus === "success"
              ? "GPS Location Logged"
              : "Capture Current GPS Coordinates"}
          </button>
        </div>

        {/* Detailed Description Field Notes */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
            Detailed Inspector Field Notes & Observations
          </label>
          <textarea
            placeholder="Document structure condition, wall finishes, roofing materials, services present, terrain, access roads, and general physical properties observation..."
            value={property.notes || ""}
            onChange={(e) => handleFieldChange("notes", e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
            id="property-notes-textarea"
          />
        </div>
      </div>
    </div>
  );
}
