export interface Point {
  x: number;
  y: number;
  label?: string; // e.g. A, B, C...
  overrideLength?: number; // Overridden edge length in meters
  isCurved?: boolean; // Is the segment starting at this point a curved arc
  curveOffset?: number; // Curvature bulge offset in meters (positive for bulge out, negative for bulge in)
}

export interface PropertyInspection {
  id: string; // unique inspection ID
  inspectionDate: string;
  valuerName: string;
  valuationPurpose: "compensation" | "market" | "rental" | "other";
  notes: string;
  
  // Sketching metrics
  polygonPoints: Point[]; // AutoCAD sketch nodes
  canvasScale: number; // Pixels per meter (e.g. 10px = 1m)
  calculatedArea: number; // area in sqm
  calculatedPerimeter: number; // perimeter in meters
  overrideArea: number | null; // can manually override the area value
  overridePerimeter?: number | null; // can manually override the perimeter value
  
  // Connected models
  photoUrls: string[]; // Base64 data strings or standard URLs
  selectedRateId: string | null;
  selectedComparableId: string | null;
  valuationAmount: number; // final computed valuation
  status: "draft" | "completed";
  
  createdAt: any;
  updatedAt: any;
}

export interface Property {
  id: string;
  userId: string;
  name: string;
  address: string;
  propertyType: "Residential" | "Commercial" | "Industrial" | "Agricultural" | "Other";
  state: string; // Lagos, Abuja, California, etc.
  ownerName?: string; // Property owner or Claimant name
  latitude: number | null;
  longitude: number | null;
  
  // Collection of individual inspections done for this property
  inspections?: PropertyInspection[];
  
  // Legacy support & quick reference attributes:
  valuerName: string;
  inspectionDate: string;
  valuationPurpose: "compensation" | "market" | "rental" | "other";
  notes: string;
  polygonPoints: Point[];
  canvasScale: number;
  calculatedArea: number;
  calculatedPerimeter: number;
  overrideArea: number | null;
  overridePerimeter?: number | null;
  photoUrls: string[];
  selectedRateId: string | null;
  selectedComparableId: string | null;
  valuationAmount: number;
  status: "draft" | "completed";
  
  createdAt: any;
  updatedAt: any;
}

export interface StateRate {
  id: string;
  userId: string; // auth uid or 'system'
  state: string;
  itemType: "Crop" | "Building" | "Tree" | "Land" | "Other";
  itemName: string; // e.g. Cocoa tree, blockwall fencing, sandcrete block, land rate
  rate: number;
  unit: string; // /sqm, /tree, /stand, /ha
  updatedAt?: any;
}

export interface Comparable {
  id: string;
  userId: string;
  propertyType: "Residential" | "Commercial" | "Industrial" | "Agricultural" | "Other";
  areaName: string; // Neighborhood, e.g. Ikoyi, Lekki, Victoria Island, Ikeja, Houston, Manhattan
  sizeSqm: number;
  saleValue: number | null; // sales transaction reference in state currency
  rentalValue: number | null; // rental transaction reference in state currency
  valuationDate: string;
  valuer: string;
  notes: string;
  createdAt: any;
}

export interface ValuationScheduleItem {
  id: string;
  userId: string;
  sn: number;
  claimantName: string;
  propertyCode: string;
  description: string;
  size: number;
  unit: string; // m², mr, no, graves, etc.
  rate: number;
  depreciation: number; // e.g. 20 for 20%
  finalValue: number;
  photoUrl: string;
  latitude: number;
  longitude: number;
  inspectionDate: string;
}

