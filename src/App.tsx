import React, { useState, useEffect } from "react";
import { Property, StateRate, Comparable, PropertyInspection } from "./types";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getDocs, collection, query, where, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from "./lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  ClipboardCheck, Plus, CheckCircle2, ShieldCheck, MapPin, 
  Ruler, BookOpen, FileText, Compass, CloudIcon, CloudLightning,
  LogOut, ArrowRight, UserCheck, HardDrive, Edit, Trash2, ChevronLeft,
  Workflow, Database, CheckSquare, Layers,
  Search, Folder, Calendar, DollarSign, Eye, ChevronRight, FileSpreadsheet,
  Building, User, Settings, Clock, Layers3, Activity, ListOrdered, Sparkles, Building2,
  Lock, RotateCcw
} from "lucide-react";

import PropertyDetailsForm from "./components/PropertyDetailsForm";
import AutoCADSketcher from "./components/AutoCADSketcher";
import CompensationRatesPanel from "./components/CompensationRatesPanel";
import PreviousComparablePanel from "./components/PreviousComparablePanel";
import MapGPSTracker from "./components/MapGPSTracker";
import MockReportViewer from "./components/MockReportViewer";
import ComprehensiveValuationSchedule from "./components/ComprehensiveValuationSchedule";

const GUEST_UID = "guest-valuer-local";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  
  // Selection & Multi-level states for Property asset vs inspections
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [activeInspectionId, setActiveInspectionId] = useState<string | null>(null);
  
  // Tab within active inspection editor workspace
  const [activeTab, setActiveTab] = useState<"details" | "sketch" | "valuation" | "photos" | "report">("details");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const [dashboardMode, setDashboardMode] = useState<"explorer" | "schedule">("explorer");

  // Search & Filter state for the properties database dashboard
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // State to manage quick creation modals
  const [showNewInspectionModal, setShowNewInspectionModal] = useState<boolean>(false);
  const [newInspectionDate, setNewInspectionDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newInspectionPurpose, setNewInspectionPurpose] = useState<"compensation" | "market" | "rental" | "other">("compensation");
  const [newInspectionValuer, setNewInspectionValuer] = useState<string>("");

  // Selected Rates state refs for dynamic valuation computations
  const [selectedRateItem, setSelectedRateItem] = useState<StateRate | null>(null);
  const [selectedComparableItem, setSelectedComparableItem] = useState<Comparable | null>(null);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsGuest(false);
        fetchCloudProperties(firebaseUser.uid);
      } else {
        setUser(null);
        // Default to guest simulation or welcome screen
        setProperties(getPreloadedMockDrafts());
        setLoading(false);
      }
    });
  }, []);

  // Sync / Fetch user properties from cloud Firestore
  const fetchCloudProperties = async (uid: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, "properties"), where("userId", "==", uid));
      const snapshot = await getDocs(q);
      const list: Property[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        list.push({
          id: doc.id,
          userId: d.userId,
          name: d.name,
          address: d.address,
          valuerName: d.valuerName || "",
          inspectionDate: d.inspectionDate || "",
          propertyType: d.propertyType,
          valuationPurpose: d.valuationPurpose || "market",
          state: d.state,
          ownerName: d.ownerName || "",
          notes: d.notes || "",
          latitude: d.latitude,
          longitude: d.longitude,
          polygonPoints: d.polygonPoints || [],
          canvasScale: d.canvasScale || 10,
          calculatedArea: d.calculatedArea || 0,
          calculatedPerimeter: d.calculatedPerimeter || 0,
          overrideArea: d.overrideArea || null,
          overridePerimeter: d.overridePerimeter || null,
          photoUrls: d.photoUrls || [],
          selectedRateId: d.selectedRateId || null,
          selectedComparableId: d.selectedComparableId || null,
          valuationAmount: d.valuationAmount || 0,
          status: d.status || "draft",
          inspections: d.inspections || [],
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        });
      });

      // If Cloud list is empty, seed standard mock files
      if (list.length === 0) {
        setProperties(getPreloadedMockDrafts());
      } else {
        setProperties(list);
      }
    } catch (err) {
      console.warn("Firestore collection pull error, using preloads.", err);
      setProperties(getPreloadedMockDrafts());
    } finally {
      setLoading(false);
    }
  };

  const getPreloadedMockDrafts = (): Property[] => {
    return [
      {
        id: "mock-draft-1",
        userId: GUEST_UID,
        name: "Lekki Phase 1 Residential Parcel",
        address: "Plot 12, Block 4, Admiralty Way, Lekki, Lagos State",
        valuerName: "ESV. Raymond Cole RSV",
        inspectionDate: "2026-06-12",
        propertyType: "Residential",
        valuationPurpose: "market",
        state: "Lagos",
        ownerName: "Alhaji Gidado Ibrahim",
        notes: "Subject property is a flat land parcel with secure perimeter block fencing. Access is via fully tarred dual carriageway. Electricity and drainage networks present on-site.",
        latitude: 6.4281,
        longitude: 3.4219,
        polygonPoints: [
          { x: 100, y: 100, label: "A" },
          { x: 250, y: 100, label: "B" },
          { x: 250, y: 200, label: "C" },
          { x: 100, y: 200, label: "D" }
        ],
        canvasScale: 10,
        calculatedArea: 150,
        calculatedPerimeter: 50,
        overrideArea: null,
        photoUrls: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80"],
        selectedRateId: null,
        selectedComparableId: "comp-1",
        valuationAmount: 27000000,
        status: "draft",
        inspections: [
          {
            id: "insp-lekki-1",
            inspectionDate: "2026-06-12",
            valuerName: "ESV. Raymond Cole RSV",
            valuationPurpose: "market",
            notes: "Subject property is a flat land parcel with secure perimeter block fencing. Access is via fully tarred dual carriageway. Electricity and drainage networks present on-site.",
            polygonPoints: [
              { x: 100, y: 100, label: "A" },
              { x: 250, y: 100, label: "B" },
              { x: 250, y: 200, label: "C" },
              { x: 100, y: 200, label: "D" }
            ],
            canvasScale: 10,
            calculatedArea: 150,
            calculatedPerimeter: 50,
            overrideArea: null,
            photoUrls: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80"],
            selectedRateId: null,
            selectedComparableId: "comp-1",
            valuationAmount: 27000000,
            status: "completed",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: "insp-lekki-2",
            inspectionDate: "2026-06-14",
            valuerName: "ESV. Raymond Cole RSV",
            valuationPurpose: "rental",
            notes: "Secondary lease assessment for administrative purposes requested by tenant's legal representative.",
            polygonPoints: [
              { x: 100, y: 100, label: "A" },
              { x: 250, y: 100, label: "B" },
              { x: 250, y: 200, label: "C" },
              { x: 100, y: 200, label: "D" }
            ],
            canvasScale: 10,
            calculatedArea: 150,
            calculatedPerimeter: 50,
            overrideArea: null,
            photoUrls: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80"],
            selectedRateId: null,
            selectedComparableId: null,
            valuationAmount: 4800000,
            status: "draft",
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "mock-draft-2",
        userId: GUEST_UID,
        name: "Calabar Crop Compensation Survey",
        address: "Zone B Agricultural Belt, Cross River State Route",
        valuerName: "ESV. Paulson Johnson RSV",
        inspectionDate: "2026-06-15",
        propertyType: "Agricultural",
        valuationPurpose: "compensation",
        state: "Rivers",
        ownerName: "Chief Obong Edet",
        notes: "Surveyed acreage allocated for dualization road compensation calculations. High density mature cassava and crop land identified.",
        latitude: 4.8156,
        longitude: 7.0498,
        polygonPoints: [
          { x: 80, y: 120, label: "A" },
          { x: 280, y: 120, label: "B" },
          { x: 220, y: 260, label: "C" },
          { x: 120, y: 260, label: "D" }
        ],
        canvasScale: 10,
        calculatedArea: 242,
        calculatedPerimeter: 68.2,
        overrideArea: null,
        photoUrls: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"],
        selectedRateId: "seed-3", // default cassava rate
        selectedComparableId: null,
        valuationAmount: 3630, // 242 * 15 (cassava)
        status: "draft",
        inspections: [
          {
            id: "insp-calabar-1",
            inspectionDate: "2026-06-15",
            valuerName: "ESV. Paulson Johnson RSV",
            valuationPurpose: "compensation",
            notes: "Surveyed acreage allocated for dualization road compensation calculations. High density mature cassava and crop land identified.",
            polygonPoints: [
              { x: 80, y: 120, label: "A" },
              { x: 280, y: 120, label: "B" },
              { x: 220, y: 260, label: "C" },
              { x: 120, y: 260, label: "D" }
            ],
            canvasScale: 10,
            calculatedArea: 242,
            calculatedPerimeter: 68.2,
            overrideArea: null,
            photoUrls: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"],
            selectedRateId: "seed-3",
            selectedComparableId: null,
            valuationAmount: 3630,
            status: "draft",
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "mock-draft-3",
        userId: GUEST_UID,
        name: "Uyo Block 2 Bungalow Valuation",
        address: "Mbiabong Etoi, Uyo, Akwa Ibom State",
        valuerName: "ESV. Raymond Cole RSV",
        inspectionDate: "2026-06-16",
        propertyType: "Residential",
        valuationPurpose: "compensation",
        state: "Akwa Ibom",
        ownerName: "Madam Beatrice Akpabio",
        notes: "Subject property is an architectural single-storey residential bungalow with high-grade aluminum roofing sheets, POP ceilings, plastered and painted blockwork, and ceramic tile finishes. Built completely on a stable, dry land terrain.",
        latitude: 5.0189,
        longitude: 7.9149,
        polygonPoints: [
          { x: 120, y: 100, label: "A" },
          { x: 260, y: 100, label: "B" },
          { x: 260, y: 220, label: "C" },
          { x: 120, y: 220, label: "D" }
        ],
        canvasScale: 10,
        calculatedArea: 168,
        calculatedPerimeter: 52,
        overrideArea: null,
        photoUrls: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"],
        selectedRateId: "akwaibom-4b", // Aluminum roof page, POP, ceramic: rate is 115,000
        selectedComparableId: null,
        valuationAmount: 19320000, // 168 * 115000
        status: "draft",
        inspections: [
          {
            id: "insp-uyo-1",
            inspectionDate: "2026-06-16",
            valuerName: "ESV. Raymond Cole RSV",
            valuationPurpose: "compensation",
            notes: "Subject property is an architectural single-storey residential bungalow with high-grade aluminum roofing sheets, POP ceilings, plastered and painted blockwork, and ceramic tile finishes. Built completely on a stable, dry land terrain.",
            polygonPoints: [
              { x: 120, y: 100, label: "A" },
              { x: 260, y: 100, label: "B" },
              { x: 260, y: 220, label: "C" },
              { x: 120, y: 220, label: "D" }
            ],
            canvasScale: 10,
            calculatedArea: 168,
            calculatedPerimeter: 52,
            overrideArea: null,
            photoUrls: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"],
            selectedRateId: "akwaibom-4b",
            selectedComparableId: null,
            valuationAmount: 19320000,
            status: "draft",
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  };

  // Google Login wrapper
  const handleGoogleAuthAction = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      alert("Social Authentication flow failed. You can continue as a Guest.");
    }
  };

  const handleLogoutAction = async () => {
    try {
      await logoutUser();
      setIsGuest(false);
    } catch (err) {
      console.error(err);
    }
  };

  const startAsGuest = () => {
    setIsGuest(true);
    setProperties(getPreloadedMockDrafts());
  };

  // Open property details dashboard (Level 2)
  const handleOpenPropertyWorkspace = (prop: Property) => {
    setCurrentProperty(prop);
    setActiveInspectionId(null); // Open Property profile level, not editor
    setSelectedRateItem(null);
    setSelectedComparableItem(null);
  };

  const handleCreateNewProperty = () => {
    const activeUid = user ? user.uid : GUEST_UID;
    const newProp: Property = {
      id: "prop-" + Date.now(),
      userId: activeUid,
      name: "New Unnamed Property Asset",
      address: "",
      valuerName: user?.displayName || "Chartered Valuer",
      inspectionDate: new Date().toISOString().split("T")[0],
      propertyType: "Residential",
      valuationPurpose: "market",
      state: "Akwa Ibom",
      ownerName: "",
      notes: "",
      latitude: null,
      longitude: null,
      polygonPoints: [],
      canvasScale: 10,
      calculatedArea: 0,
      calculatedPerimeter: 0,
      overrideArea: null,
      overridePerimeter: null,
      photoUrls: [],
      selectedRateId: null,
      selectedComparableId: null,
      valuationAmount: 0,
      status: "draft",
      inspections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCurrentProperty(newProp);
    setActiveInspectionId(null); // start at property file dashboard
    setActiveTab("details");
  };

  // Handle updates dynamically, forwarding them to the active inspection if in editor mode
  const handleUpdateCurrentProperty = (updates: Partial<Property>) => {
    if (!currentProperty) return;
    let updated = { ...currentProperty, ...updates } as Property;

    if (activeInspectionId) {
      const insps = currentProperty.inspections ? [...currentProperty.inspections] : [];
      const idx = insps.findIndex(i => i.id === activeInspectionId);
      if (idx !== -1) {
        const updatedInsp = {
          ...insps[idx],
          // Map properties that are modified inside the workspace down to the active sub-inspection record
          ...(updates.valuerName !== undefined && { valuerName: updates.valuerName }),
          ...(updates.inspectionDate !== undefined && { inspectionDate: updates.inspectionDate }),
          ...(updates.valuationPurpose !== undefined && { valuationPurpose: updates.valuationPurpose }),
          ...(updates.notes !== undefined && { notes: updates.notes }),
          ...(updates.polygonPoints !== undefined && { polygonPoints: updates.polygonPoints }),
          ...(updates.canvasScale !== undefined && { canvasScale: updates.canvasScale }),
          ...(updates.calculatedArea !== undefined && { calculatedArea: updates.calculatedArea }),
          ...(updates.calculatedPerimeter !== undefined && { calculatedPerimeter: updates.calculatedPerimeter }),
          ...(updates.overrideArea !== undefined && { overrideArea: updates.overrideArea }),
          ...(updates.overridePerimeter !== undefined && { overridePerimeter: updates.overridePerimeter }),
          ...(updates.photoUrls !== undefined && { photoUrls: updates.photoUrls }),
          ...(updates.selectedRateId !== undefined && { selectedRateId: updates.selectedRateId }),
          ...(updates.selectedComparableId !== undefined && { selectedComparableId: updates.selectedComparableId }),
          ...(updates.valuationAmount !== undefined && { valuationAmount: updates.valuationAmount }),
          ...(updates.status !== undefined && { status: updates.status }),
          updatedAt: new Date().toISOString()
        } as PropertyInspection;

        insps[idx] = updatedInsp;
        updated.inspections = insps;

        // Sync back parameters to top level so legacy component dependencies continue working smoothly
        updated = {
          ...updated,
          valuerName: updatedInsp.valuerName,
          inspectionDate: updatedInsp.inspectionDate,
          valuationPurpose: updatedInsp.valuationPurpose,
          notes: updatedInsp.notes,
          polygonPoints: updatedInsp.polygonPoints,
          canvasScale: updatedInsp.canvasScale,
          calculatedArea: updatedInsp.calculatedArea,
          calculatedPerimeter: updatedInsp.calculatedPerimeter,
          overrideArea: updatedInsp.overrideArea,
          overridePerimeter: updatedInsp.overridePerimeter || null,
          photoUrls: updatedInsp.photoUrls,
          selectedRateId: updatedInsp.selectedRateId,
          selectedComparableId: updatedInsp.selectedComparableId,
          valuationAmount: updatedInsp.valuationAmount,
          status: updatedInsp.status,
          updatedAt: new Date().toISOString()
        };
      }
    }

    setCurrentProperty(updated);

    // Dynamic auto-cache update inside the properties selection list
    const existingIdx = properties.findIndex(p => p.id === currentProperty.id);
    if (existingIdx !== -1) {
      const listUpdated = [...properties];
      listUpdated[existingIdx] = updated;
      setProperties(listUpdated);
    }
  };

  // Start the full multi-tab AutoCAD, GPS, Photos, Multipliers inspection editor workspace (Level 3)
  const handleStartInspectionEditor = (inspId: string) => {
    if (!currentProperty || !currentProperty.inspections) return;
    const insp = currentProperty.inspections.find(i => i.id === inspId);
    if (!insp) return;

    setActiveInspectionId(inspId);
    setActiveTab("details");

    // Copy selected inspection properties to active top-level references
    setCurrentProperty({
      ...currentProperty,
      valuerName: insp.valuerName,
      inspectionDate: insp.inspectionDate,
      valuationPurpose: insp.valuationPurpose,
      notes: insp.notes,
      polygonPoints: insp.polygonPoints || [],
      canvasScale: insp.canvasScale || 10,
      calculatedArea: insp.calculatedArea || 0,
      calculatedPerimeter: insp.calculatedPerimeter || 0,
      overrideArea: insp.overrideArea,
      photoUrls: insp.photoUrls || [],
      selectedRateId: insp.selectedRateId,
      selectedComparableId: insp.selectedComparableId,
      valuationAmount: insp.valuationAmount || 0,
      status: insp.status || "draft"
    });
  };

  // Create a brand new independent inspection run for this property (Level 2 list)
  const handleCreateNewInspection = (date: string, purpose: "compensation" | "market" | "rental" | "other", valuer: string) => {
    if (!currentProperty) return;

    const newInsp: PropertyInspection = {
      id: "insp-" + Date.now(),
      inspectionDate: date,
      valuerName: valuer || user?.displayName || "Chartered Valuer",
      valuationPurpose: purpose,
      notes: `Consultant inspection survey logged on ${date}.`,
      polygonPoints: [],
      canvasScale: 10,
      calculatedArea: 0,
      calculatedPerimeter: 0,
      overrideArea: null,
      photoUrls: [],
      selectedRateId: null,
      selectedComparableId: null,
      valuationAmount: 0,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedInsps = currentProperty.inspections ? [...currentProperty.inspections, newInsp] : [newInsp];

    const updatedProp = {
      ...currentProperty,
      inspections: updatedInsps,
      valuerName: newInsp.valuerName,
      inspectionDate: newInsp.inspectionDate,
      valuationPurpose: newInsp.valuationPurpose,
      notes: newInsp.notes,
      polygonPoints: [],
      canvasScale: 10,
      calculatedArea: 0,
      calculatedPerimeter: 0,
      overrideArea: null,
      photoUrls: [],
      selectedRateId: null,
      selectedComparableId: null,
      valuationAmount: 0,
      status: "draft" as const,
      updatedAt: new Date().toISOString()
    };

    setCurrentProperty(updatedProp);
    setActiveInspectionId(newInsp.id);
    setActiveTab("details");

    // Sync master collection immediately
    const existingIdx = properties.findIndex(p => p.id === currentProperty.id);
    const listUpdated = [...properties];
    if (existingIdx !== -1) {
      listUpdated[existingIdx] = updatedProp;
    } else {
      listUpdated.unshift(updatedProp);
    }
    setProperties(listUpdated);

    if (user) {
      const docRef = doc(db, "properties", currentProperty.id);
      setDoc(docRef, {
        ...updatedProp,
        createdAt: currentProperty.createdAt instanceof Date ? currentProperty.createdAt.toISOString() : currentProperty.createdAt || new Date().toISOString(),
        updatedAt: serverTimestamp()
      }).catch(err => console.warn("Firestore save failure:", err));
    }
  };

  // Delete an individual inspection from a property's record library
  const handleDeleteInspection = (e: React.MouseEvent, inspId: string) => {
    e.stopPropagation();
    if (!currentProperty || !confirm("Are you sure you want to discard this individual inspection survey? All AutoCAD configurations and rate valuations logged inside it will be lost.")) return;

    const updatedInsps = (currentProperty.inspections || []).filter(i => i.id !== inspId);
    const updatedProp = {
      ...currentProperty,
      inspections: updatedInsps,
      updatedAt: new Date().toISOString()
    };

    setCurrentProperty(updatedProp);
    if (activeInspectionId === inspId) {
      setActiveInspectionId(null);
    }

    const existingIdx = properties.findIndex(p => p.id === currentProperty.id);
    if (existingIdx !== -1) {
      const listUpdated = [...properties];
      listUpdated[existingIdx] = updatedProp;
      setProperties(listUpdated);
    }

    if (user) {
      const docRef = doc(db, "properties", currentProperty.id);
      updateDoc(docRef, {
        inspections: updatedInsps
      }).catch(err => console.warn("Firestore delete-inspection failure:", err));
    }
  };

  // GPS satellite telemetry capture
  const handleCaptureRealGPS = () => {
    setGpsStatus("loading");
    if (!navigator.geolocation) {
      setGpsStatus("error");
      const baseLat = 6.4280 + (Math.random() - 0.5) * 0.005;
      const baseLng = 3.4210 + (Math.random() - 0.5) * 0.005;
      handleUpdateCurrentProperty({ latitude: baseLat, longitude: baseLng });
      setTimeout(() => setGpsStatus("success"), 800);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleUpdateCurrentProperty({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setGpsStatus("success");
      },
      (err) => {
        console.warn("Telemetry timeout, placing simulated sector coordinate.");
        const baseLat = 6.42512;
        const baseLng = 3.42398;
        handleUpdateCurrentProperty({ latitude: baseLat, longitude: baseLng });
        setGpsStatus("success");
      },
      { timeout: 7000 }
    );
  };

  // State valuation callbacks for calculations
  const handleSelectCompensationRate = (rateId: string | null, finalValue: number, rateItem: StateRate | null) => {
    setSelectedRateItem(rateItem);
    handleUpdateCurrentProperty({
      selectedRateId: rateId,
      valuationAmount: finalValue
    });
  };

  const handleSelectMarketComparable = (compId: string | null, finalValue: number, compItem: Comparable | null) => {
    setSelectedComparableItem(compItem);
    handleUpdateCurrentProperty({
      selectedComparableId: compId,
      valuationAmount: finalValue
    });
  };

  // Commit / Save drafts via LocalState and Firestore CloudSync
  const handleSavePropertyDraft = async () => {
    if (!currentProperty) return;
    setSyncing(true);
    
    const timestampedProperty = {
      ...currentProperty,
      updatedAt: new Date().toISOString()
    };

    try {
      if (user) {
        const docRef = doc(db, "properties", currentProperty.id);
        const fbPayload = {
          ...timestampedProperty,
          createdAt: currentProperty.createdAt instanceof Date ? currentProperty.createdAt.toISOString() : currentProperty.createdAt || new Date().toISOString(),
          updatedAt: serverTimestamp()
        };
        await setDoc(docRef, fbPayload);
      }

      const existingIdx = properties.findIndex(p => p.id === currentProperty.id);
      if (existingIdx !== -1) {
        const listUpdated = [...properties];
        listUpdated[existingIdx] = timestampedProperty as Property;
        setProperties(listUpdated);
      } else {
        setProperties([timestampedProperty as Property, ...properties]);
      }

      alert("Consultant file data and all registered surveys synced matches successfully!");
    } catch (err: any) {
      console.error("Save failed:", err);
      handleFirestoreError(err, OperationType.WRITE, "properties");
    } finally {
      setSyncing(false);
    }
  };

  // Complete field notes certification & lock
  const handleFinalizePropertyValuation = async () => {
    if (!currentProperty) return;
    
    let updatedPropertyObj = { ...currentProperty };
    
    if (activeInspectionId && updatedPropertyObj.inspections) {
      const updatedInsps = updatedPropertyObj.inspections.map(i => {
        if (i.id === activeInspectionId) {
          return { ...i, status: "completed" as const, updatedAt: new Date().toISOString() };
        }
        return i;
      });
      updatedPropertyObj.inspections = updatedInsps;
    }
    
    updatedPropertyObj.status = "completed" as const;
    updatedPropertyObj.updatedAt = new Date().toISOString();

    try {
      if (user) {
        const docRef = doc(db, "properties", currentProperty.id);
        const fbPayload = {
          ...updatedPropertyObj,
          createdAt: currentProperty.createdAt instanceof Date ? currentProperty.createdAt.toISOString() : currentProperty.createdAt || new Date().toISOString(),
          updatedAt: serverTimestamp()
        };
        await setDoc(docRef, fbPayload);
      }

      const existingIdx = properties.findIndex(p => p.id === currentProperty.id);
      if (existingIdx !== -1) {
        const listUpdated = [...properties];
        listUpdated[existingIdx] = updatedPropertyObj;
        setProperties(listUpdated);
      } else {
        setProperties([updatedPropertyObj, ...properties]);
      }

      setCurrentProperty(updatedPropertyObj);
      alert("Appraisal report successfully committed & certified!");
    } catch (err) {
      console.error("Finalization failed:", err);
    }
  };

  // Delete records
  const handleDeletePropertyRecord = async (propId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this property asset registry? All connected inspection events, coordinates and maps will be erased permanently.")) return;

    try {
      if (user) {
        await deleteDoc(doc(db, "properties", propId));
      }
      setProperties(properties.filter(p => p.id !== propId));
      if (currentProperty?.id === propId) {
        setCurrentProperty(null);
        setActiveInspectionId(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Visual Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center p-6 text-slate-500">
        <Compass className="h-10 w-10 text-blue-600 animate-spin mb-3 font-bold" />
        <span className="font-semibold text-slate-800 tracking-tight text-sm">Booting ValuField CAD Database...</span>
        <p className="text-[10px] text-slate-400 font-mono mt-1">ACQUIRING CLOUD SYNC CERTIFICATES</p>
      </div>
    );
  }

  // Authentic Welcoming Gate (Authentication Check)
  if (!user && !isGuest) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6 text-center" id="auth-welcome-card">
          <div className="mx-auto bg-blue-50 text-blue-600 h-16 w-16 rounded-xl flex items-center justify-center border border-blue-100">
            <ClipboardCheck className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              ValuField Pro <span className="text-slate-400 font-normal text-xs ml-1 font-mono">v4.2.0</span>
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Professional applet for RSV Chartered Valuers & Field Surveyors. Instantly outline parcels, calculate area via AutoCAD-precision toolchains, auto-draft appraisals, and log telemetry offline.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl text-left border border-slate-200 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">SYSTEM INTERFACES & PERMISSIONS</span>
            <ul className="text-xs text-slate-600 space-y-1.5 font-sans">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" /> Real-time Shoelace CAD area parser</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" /> State-rates CSV upload & auto-digitization</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" /> Secure Firebase offline records Sync</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" /> Gemini PDF/Markdown valuation reporter</li>
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleGoogleAuthAction}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              id="google-signin-btn"
            >
              <Database className="h-4 w-4 text-blue-400" />
              Sign in with Google Account
            </button>
            
            <button
              onClick={startAsGuest}
              className="w-full py-2.5 px-4 text-slate-600 hover:text-slate-800 font-medium text-xs rounded-lg hover:bg-slate-50 transition-all border border-slate-250 cursor-pointer"
              id="guest-signin-btn"
            >
              Continue as Guest (Local Sandbox)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 flex flex-col font-sans">
      {/* Upper Valuation Portal Navigation Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-lg shadow-sm border border-blue-500">
            V
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight leading-none font-sans flex items-center gap-1.5">
              ValuField Pro <span className="text-slate-400 font-normal text-[11px] font-mono">v4.2.0</span>
            </h1>
            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono mt-0.5">
              <span className={`px-1 rounded text-white font-bold uppercase ${user ? "bg-emerald-600" : "bg-amber-600"}`}>
                {user ? "Cloud Sync Active" : "GUEST LOCAL"}
              </span>
              <span>•</span>
              <span className="truncate max-w-[150px] md:max-w-none">Project: {user ? user.email : "Local Sandbox"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <span className="text-xs font-semibold text-slate-200 block leading-tight">{user.displayName}</span>
                <span className="text-[9px] text-slate-400 font-mono block">{user.email}</span>
              </div>
              <button
                onClick={handleLogoutAction}
                className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="Disconnect cloud session"
                id="header-logout-btn"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleAuthAction}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
              id="header-connect-cloud-btn"
            >
              Connect CloudSync
            </button>
          )}
        </div>
      </header>      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {!currentProperty ? (
            /* ================= LEVEL 1: PROPERTIES MASTER DATABASE BOARD ================= */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
              key="dashboard-view"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    Property Assets Registry Database
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Centralized database of all picked properties and assets. Select any property record to view its nested historical surveys and complete individual inspections.
                  </p>
                </div>
                <button
                  onClick={handleCreateNewProperty}
                  className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shrink-0 self-start md:self-auto cursor-pointer transition-all"
                  id="dashboard-create-btn"
                >
                  <Plus className="h-4 w-4" />
                  Add Property File
                </button>
              </div>

              {/* SEPARATOR BUTTONS FOR WORKSPACE DIRECTORY VS MASTER COMPENSATION SPREADSHEET */}
              <div className="flex border-b border-slate-200 gap-1 mt-2 overflow-x-auto" id="dashboard-mode-selector">
                <button
                  onClick={() => setDashboardMode("explorer")}
                  className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    dashboardMode === "explorer"
                      ? "border-blue-600 text-blue-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                  id="tab-mode-explorer"
                >
                  <Folder className="h-4 w-4" />
                  Asset Folder Registry (AutoCAD/GPS)
                </button>
                <button
                  onClick={() => setDashboardMode("schedule")}
                  className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer/mode-button ${
                    dashboardMode === "schedule"
                      ? "border-blue-600 text-blue-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                  id="tab-mode-schedule"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Comprehensive Valuation Register (Consultant Table)
                </button>
              </div>

              {dashboardMode === "explorer" ? (
                <>
                  {/* Advanced Search & Filtering Utilities */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-100/50 p-4 rounded-xl border border-slate-200" id="search-filter-panel">
                    <div className="relative w-full sm:max-w-md">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by property label, owner, or physical address..."
                        className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        id="property-search-input"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono shrink-0">Type:</span>
                      {["All", "Residential", "Commercial", "Agricultural"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer shrink-0 ${
                            categoryFilter === cat
                              ? "bg-blue-50 border-blue-200 text-blue-600 font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                          id={`filter-cat-${cat}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid listings of properties */}
                  {(() => {
                    const filtered = properties.filter((prop) => {
                      const queryText = searchQuery.toLowerCase();
                      const matchesSearch =
                        prop.name.toLowerCase().includes(queryText) ||
                        prop.address.toLowerCase().includes(queryText) ||
                        (prop.ownerName && prop.ownerName.toLowerCase().includes(queryText));
                      const matchesCategory = categoryFilter === "All" || prop.propertyType === categoryFilter;
                      return matchesSearch && matchesCategory;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center" id="empty-state-screen">
                          <Folder className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <h3 className="font-bold text-slate-800 text-sm">No matching property files found</h3>
                          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                            Refine your filter query or add a brand new property asset container files to get started with surveying.
                          </p>
                          <button
                            onClick={() => { setSearchQuery(""); setCategoryFilter("All"); }}
                            className="mt-4 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold rounded-lg cursor-pointer"
                            id="reset-filters-btn"
                          >
                            Reset All Filters
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((prop) => {
                          const loggedCount = prop.inspections?.length || 0;
                          return (
                            <div
                              key={prop.id}
                              onClick={() => handleOpenPropertyWorkspace(prop)}
                              className="bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 relative group"
                              id={`dashboard-prop-card-${prop.id}`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                    prop.status === "completed" 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                      : "bg-amber-50 text-amber-700 border border-amber-100"
                                  }`}>
                                    {prop.propertyType}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase flex items-center gap-1">
                                    <Activity className="h-3 w-3 text-slate-400" />
                                    {loggedCount === 1 ? "1 Inspection logged" : `${loggedCount} Inspections logged`}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition truncate leading-snug">{prop.name}</h3>
                                  <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    <span className="truncate">{prop.address || "No official address logged"}</span>
                                  </p>
                                  {prop.ownerName && (
                                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                      <User className="h-3 w-3 text-slate-400 shrink-0" />
                                      <span>Owner: <strong>{prop.ownerName}</strong></span>
                                    </p>
                                  )}
                                </div>

                                {/* State list */}
                                <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2.5 rounded-xl text-[9px] font-mono border border-slate-100">
                                  <div>
                                    <span className="text-slate-400 block uppercase tracking-wider font-semibold">State</span>
                                    <span className="font-bold text-slate-700 block mt-0.5 truncate">{prop.state}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block uppercase tracking-wider font-semibold">Coordinates</span>
                                    <span className="font-bold text-slate-700 block mt-0.5 truncate">
                                      {prop.latitude ? `${prop.latitude.toFixed(3)}, ${prop.longitude?.toFixed(3)}` : "TBD"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block uppercase tracking-wider font-semibold">Valuation</span>
                                    <span className="font-bold text-emerald-600 block mt-0.5 truncate">
                                      ₦{prop.valuationAmount ? prop.valuationAmount.toLocaleString() : "TBD"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-blue-600 font-mono font-bold bg-blue-50/50 px-2.5 py-1 rounded-lg">
                                  {prop.status === "completed" ? "✓ Fully Certified File" : "✥ Draft Workspace"}
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => handleDeletePropertyRecord(prop.id, e)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                    title="Delete entire property profile"
                                    id={`delete-record-btn-${prop.id}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition flex items-center gap-1">
                                    Open File
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <ComprehensiveValuationSchedule 
                  userId={user ? user.uid : GUEST_UID} 
                  onImportCADData={(item) => {
                    // Try to match the schedule item with a property file in the workspace
                    const codeMatch = item?.propertyCode 
                      ? properties.find(p => p.address?.toLowerCase().includes(item.propertyCode.toLowerCase()) || 
                                             p.name?.toLowerCase().includes(item.propertyCode.toLowerCase()))
                      : null;
                    
                    const nameMatch = item?.claimantName
                      ? properties.find(p => p.ownerName?.toLowerCase().includes(item.claimantName.toLowerCase()) ||
                                             p.name?.toLowerCase().includes(item.claimantName.toLowerCase()))
                      : null;

                    const match = codeMatch || nameMatch || currentProperty || properties.find(p => p.polygonPoints && p.polygonPoints.length >= 3);
                    
                    if (match && match.polygonPoints && match.polygonPoints.length >= 3) {
                      return {
                        area: match.overrideArea || match.calculatedArea || 0,
                        perimeter: match.calculatedPerimeter || 0,
                        pointsCount: match.polygonPoints.length
                      };
                    }
                    return { area: 0, perimeter: 0, pointsCount: 0 };
                  }}
                  activeCADMetrics={(() => {
                    const activeP = currentProperty || properties.find(p => p.polygonPoints && p.polygonPoints.length >= 3);
                    if (activeP) {
                      return {
                        area: activeP.overrideArea || activeP.calculatedArea || 0,
                        perimeter: activeP.calculatedPerimeter || 0,
                        pointsCount: activeP.polygonPoints?.length || 0
                      };
                    }
                    return null;
                  })()}
                  onNavigateToCAD={(item) => {
                    // 1. Try to find match
                    const codeMatch = item?.propertyCode 
                      ? properties.find(p => p.address?.toLowerCase().includes(item.propertyCode.toLowerCase()) || 
                                             p.name?.toLowerCase().includes(item.propertyCode.toLowerCase()))
                      : null;
                    
                    const nameMatch = item?.claimantName
                      ? properties.find(p => p.ownerName?.toLowerCase().includes(item.claimantName.toLowerCase()) ||
                                             p.name?.toLowerCase().includes(item.claimantName.toLowerCase()))
                      : null;

                    let match = codeMatch || nameMatch;
                    let updatedProperties = [...properties];

                    if (!match) {
                      // Proactively create a custom property for this claimant
                      const activeUid = user ? user.uid : GUEST_UID;
                      match = {
                        id: "prop-" + Date.now(),
                        userId: activeUid,
                        name: item.claimantName ? `${item.claimantName} - Property File` : "AutoCAD Asset File",
                        address: item.propertyCode ? `Property Code: ${item.propertyCode}` : "Physical Address",
                        valuerName: user?.displayName || "Chartered Valuer",
                        inspectionDate: new Date().toISOString().split("T")[0],
                        propertyType: "Residential",
                        valuationPurpose: "compensation",
                        state: "Akwa Ibom",
                        ownerName: item.claimantName || "",
                        latitude: 5.0312,
                        longitude: 7.9125,
                        polygonPoints: [],
                        canvasScale: 10,
                        calculatedArea: 0,
                        calculatedPerimeter: 0,
                        overrideArea: null,
                        overridePerimeter: null,
                        photoUrls: [],
                        inspections: [],
                        status: "draft",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      };
                      updatedProperties.push(match);
                    }

                    // 2. Ensure property has an active inspection configured
                    let inspectionsList = match.inspections ? [...match.inspections] : [];
                    let activeInsp = inspectionsList[0];
                    
                    if (!activeInsp) {
                      activeInsp = {
                        id: "insp-" + Date.now(),
                        inspectionDate: new Date().toISOString().split("T")[0],
                        valuerName: user?.displayName || "Chartered Valuer",
                        valuationPurpose: "compensation",
                        notes: `AutoCAD Survey generated from Valuation Register for ${item.claimantName || "Claimant"}.`,
                        polygonPoints: [],
                        canvasScale: 10,
                        calculatedArea: 0,
                        calculatedPerimeter: 0,
                        overrideArea: null,
                        overridePerimeter: null,
                        photoUrls: [],
                        selectedRateId: null,
                        selectedComparableId: null,
                        valuationAmount: 0,
                        status: "draft",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      };
                      inspectionsList.push(activeInsp);
                      match.inspections = inspectionsList;
                      
                      const matchIdx = updatedProperties.findIndex(p => p.id === match.id);
                      if (matchIdx !== -1) {
                        updatedProperties[matchIdx] = match;
                      }
                    }

                    // Save 
                    setProperties(updatedProperties);

                    // 3. Select and switch view
                    setCurrentProperty({
                      ...match,
                      valuerName: activeInsp.valuerName,
                      inspectionDate: activeInsp.inspectionDate,
                      valuationPurpose: activeInsp.valuationPurpose,
                      notes: activeInsp.notes,
                      polygonPoints: activeInsp.polygonPoints || [],
                      canvasScale: activeInsp.canvasScale || 10,
                      calculatedArea: activeInsp.calculatedArea || 0,
                      calculatedPerimeter: activeInsp.calculatedPerimeter || 0,
                      overrideArea: activeInsp.overrideArea,
                      overridePerimeter: activeInsp.overridePerimeter || null,
                      photoUrls: activeInsp.photoUrls || [],
                      selectedRateId: activeInsp.selectedRateId,
                      selectedComparableId: activeInsp.selectedComparableId,
                      valuationAmount: activeInsp.valuationAmount || 0,
                      status: activeInsp.status || "draft"
                    });

                    setActiveInspectionId(activeInsp.id);
                    setActiveTab("sketch");
                  }}
                />
              )}
            </motion.div>
          ) : !activeInspectionId ? (
            /* ================= LEVEL 2: PROPERTY FILE DETAIL & INDIVIDUAL INSPECTIONS LEDGER ================= */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 animate-fade-in"
              key="property-profile-level"
            >
              {/* Profile Bar Navigation */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentProperty(null)}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer shadow-xs"
                    id="profile-back-to-homescreen"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-widest block">PROPERTY FILE ARCHIVE</span>
                    <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight leading-snug">
                      {currentProperty.name}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSavePropertyDraft}
                    disabled={syncing}
                    className="px-3.5 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    id="profile-save-file-btn"
                  >
                    <CloudIcon className={`h-3.5 w-3.5 text-blue-600 ${syncing ? "animate-bounce" : ""}`} />
                    {user ? "Cloud Sync File" : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Two Panel Dynamic Grid Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left side: Property Asset Metadata card (Owner, Location, Type details which are static) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden" id="profile-details-card">
                    <div className="bg-slate-900 px-5 py-4 text-white flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-400" />
                      <h3 className="font-bold text-xs uppercase tracking-wider font-sans">Core Asset Coordinates & Classification</h3>
                    </div>

                    <div className="p-5 space-y-4 font-sans">
                      {/* Name input */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Property Identification Name
                        </label>
                        <input
                          type="text"
                          value={currentProperty.name}
                          onChange={(e) => handleUpdateCurrentProperty({ name: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          placeholder="e.g. Lekki Phase 1 Residential Parcel"
                          id="meta-property-name"
                        />
                      </div>

                      {/* Owner's Name (Direct addressal of request #2) */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Property Owner's Full Name
                        </label>
                        <input
                          type="text"
                          value={currentProperty.ownerName || ""}
                          onChange={(e) => handleUpdateCurrentProperty({ ownerName: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans font-medium text-slate-900"
                          placeholder="Provide proprietor / stakeholder name..."
                          id="meta-owner-name-input"
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Physical Address Location
                        </label>
                        <textarea
                          rows={2}
                          value={currentProperty.address}
                          onChange={(e) => handleUpdateCurrentProperty({ address: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          placeholder="e.g. Plot 12, Block 4, Admiralty Way, Lekki..."
                          id="meta-property-address"
                        />
                      </div>

                      {/* Layout Type & State Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Asset Classification
                          </label>
                          <select
                            value={currentProperty.propertyType}
                            onChange={(e) => handleUpdateCurrentProperty({ propertyType: e.target.value as any })}
                            className="w-full text-xs px-2 py-2 border border-slate-250 bg-white rounded-lg focus:outline-none font-sans"
                            id="meta-property-type"
                          >
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Agricultural">Agricultural</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Geopolitical State
                          </label>
                          <select
                            value={currentProperty.state}
                            onChange={(e) => handleUpdateCurrentProperty({ state: e.target.value })}
                            className="w-full text-xs px-2 py-2 border border-slate-250 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                            id="meta-property-state"
                          >
                            <option value="Akwa Ibom">Akwa Ibom</option>
                            <option value="Lagos">Lagos</option>
                            <option value="Rivers">Rivers</option>
                            <option value="Cross River">Cross River</option>
                            <option value="Delta">Delta</option>
                          </select>
                        </div>
                      </div>

                      {/* Simulated GPS Coordinate Center */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Survey Origin GPS Anchors
                        </span>
                        <div className="flex items-center justify-between gap-3 font-mono mt-2">
                          <div className="text-xs text-slate-600">
                            Lat: <span className="font-bold text-slate-900">{currentProperty.latitude?.toFixed(5) || "None"}</span> • 
                            Lng: <span className="font-bold text-slate-900">{currentProperty.longitude?.toFixed(5) || "None"}</span>
                          </div>
                          <button
                            onClick={handleCaptureRealGPS}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-mono text-[9px] uppercase font-bold rounded-lg flex items-center gap-1 cursor-pointer transition"
                            id="meta-gps-acquire-btn"
                          >
                            <Compass className="h-3 w-3 animate-pulse" />
                            {gpsStatus === "loading" ? "Reading..." : "Acquire GPS"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] text-blue-800 leading-normal font-medium">
                    This file aggregates independent surveys logged over time. Changes here apply to all parent fields across reports.
                  </div>
                </div>

                {/* Right side: Historical individual surveys ledger list (Addressing Consultant request #4) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ListOrdered className="h-4 w-4 text-blue-400" />
                        <h3 className="font-bold text-xs uppercase tracking-wider font-sans">Individual Survey Inspection Visit Logs</h3>
                      </div>
                      <button
                        onClick={() => setShowNewInspectionModal(true)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer transition shadow-xs"
                        id="open-new-inspection-modal-btn"
                      >
                        <Plus className="h-3 w-3" />
                        New Survey Log
                      </button>
                    </div>

                    <div className="p-5 font-sans">
                      {/* Check if property has inspections registered */}
                      {(!currentProperty.inspections || currentProperty.inspections.length === 0) ? (
                        <div className="text-center py-10" id="empty-inspections-list">
                          <Activity className="h-10 w-10 text-slate-350 mx-auto mb-3" />
                          <h4 className="font-bold text-slate-700 text-xs">No individual inspections logged for this asset</h4>
                          <p className="text-[11px] text-slate-450 mt-1 max-w-sm mx-auto">
                            Add a new physical visit event node, calculate its AutoCAD perimeter and scale, and certify independent evaluation reports.
                          </p>
                          <button
                            onClick={() => setShowNewInspectionModal(true)}
                            className="mt-4 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                            id="empty-state-log-insp-btn"
                          >
                            Initialize First Survey Work
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3" id="inspections-ledger-list">
                          {currentProperty.inspections.map((insp) => {
                            const hasDraftStatus = insp.status !== "completed";
                            return (
                              <div
                                key={insp.id}
                                onClick={() => handleStartInspectionEditor(insp.id)}
                                className={`border border-slate-200 hover:border-blue-400 rounded-xl p-4 transition-all hover:bg-blue-50/20 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
                                id={`inspection-row-${insp.id}`}
                              >
                                <div className="space-y-1.5 max-w-sm sm:max-w-md">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 uppercase">
                                      {insp.valuationPurpose}
                                    </span>
                                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                                      insp.status === "completed" 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                        : "bg-amber-50 text-amber-700 border-amber-100"
                                    }`}>
                                      {insp.status || "draft"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 font-semibold">
                                      <Calendar className="h-3 w-3" /> {insp.inspectionDate}
                                    </span>
                                  </div>

                                  <div className="text-xs text-slate-600 font-medium">
                                    Valuer: <strong className="text-slate-800 font-bold">{insp.valuerName}</strong>
                                  </div>

                                  <p className="text-[11px] text-slate-500 italic truncate max-w-full">
                                    "{insp.notes || "No notes logged for this visit."}"
                                  </p>

                                  <div className="flex gap-4 text-[10px] font-mono text-slate-500">
                                    <span>Area: <strong className="text-slate-900">{insp.overrideArea || insp.calculatedArea || 0} m²</strong></span>
                                    <span>Valuation Amount: <strong className="text-emerald-700">₦{insp.valuationAmount ? insp.valuationAmount.toLocaleString() : "0"}</strong></span>
                                  </div>
                                </div>

                                <div className="flex sm:flex-col items-end gap-2 self-stretch justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                                  <span className="text-xs text-blue-600 font-bold flex items-center gap-1 bg-white hover:bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-lg shadow-2xs">
                                    Run CAD / Valuation
                                    <ChevronRight className="h-3 w-3" />
                                  </span>

                                  <button
                                    onClick={(e) => handleDeleteInspection(e, insp.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                    title="Delete inspection history node"
                                    id={`delete-inspection-btn-${insp.id}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Log New Inspection popup Modal overlay */}
              {showNewInspectionModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="new-inspection-modal-overlay">
                  <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-lg overflow-hidden animate-zoom-in" id="new-inspection-modal-body">
                    <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-400" />
                        <h3 className="font-bold text-xs uppercase tracking-wider font-sans">Configure Inspection Visit</h3>
                      </div>
                      <button
                        onClick={() => setShowNewInspectionModal(false)}
                        className="text-slate-400 hover:text-white transition text-sm cursor-pointer"
                        id="close-modal-icon-btn"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-6 space-y-4 font-sans">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Inspection Visit Date
                        </label>
                        <input
                          type="date"
                          value={newInspectionDate}
                          onChange={(e) => setNewInspectionDate(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          id="modal-inspection-date"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Survey Purpose / Objective
                        </label>
                        <select
                          value={newInspectionPurpose}
                          onChange={(e) => setNewInspectionPurpose(e.target.value as any)}
                          className="w-full text-xs px-2 py-2 border border-slate-250 bg-white rounded-lg focus:outline-none"
                          id="modal-inspection-purpose"
                        >
                          <option value="compensation">Crop / Struct Compensation</option>
                          <option value="market">Open Market valuation</option>
                          <option value="rental">Rental Assessment</option>
                          <option value="other">Other Appraisal</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Assigned Field Valuer RSV
                        </label>
                        <input
                          type="text"
                          value={newInspectionValuer}
                          onChange={(e) => setNewInspectionValuer(e.target.value)}
                          placeholder="e.g. ESV. Raymond Cole RSV"
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          id="modal-inspection-valuer"
                        />
                      </div>

                      <div className="flex gap-2.5 pt-4">
                        <button
                          onClick={() => {
                            handleCreateNewInspection(newInspectionDate, newInspectionPurpose, newInspectionValuer);
                            setShowNewInspectionModal(false);
                          }}
                          className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-xs"
                          id="confirm-create-inspection"
                        >
                          Launch Survey Workspace
                        </button>
                        <button
                          onClick={() => setShowNewInspectionModal(false)}
                          className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition"
                          id="cancel-create-inspection"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* ================= LEVEL 3: ACTIVE SURVEY INSPECTION WORKSPACE EDITOR ================= */
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="space-y-6"
              key="workspace-view"
            >
              {/* Back navigation header bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveInspectionId(null)}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer shadow-xs"
                    id="exit-inspection-editor-btn"
                    title="Return to property database record profile"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">
                        SURVEY WORKSPACE
                      </span>
                      <span>•</span>
                      <span className="text-[10px] font-mono text-slate-400">File ID: {currentProperty.id}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">{currentProperty.name}</h2>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        currentProperty.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {currentProperty.status} ({currentProperty.valuationPurpose?.toUpperCase()})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setActiveInspectionId(null);
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all border border-slate-250"
                    id="button-return-to-asset-profile"
                  >
                    <Folder className="h-3.5 w-3.5 text-slate-500" />
                    Property File Archive
                  </button>

                  <button
                    onClick={handleSavePropertyDraft}
                    disabled={syncing}
                    className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-705 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    id="workspace-save-draft"
                  >
                    <CloudIcon className={`h-3.5 w-3.5 text-blue-600 ${syncing ? "animate-bounce" : ""}`} />
                    {user ? "Cloud Sync Draft" : "Save Local Draft"}
                  </button>
                  {currentProperty.status !== "completed" && (
                    <button
                      onClick={handleFinalizePropertyValuation}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                      id="workspace-finalize-certificate"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Certify Valuation Report
                    </button>
                  )}
                </div>
              </div>

              {/* Responsive tabs matrix */}
              <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "details"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                  id="tab-details-btn"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Subject Info
                </button>
                <button
                  onClick={() => setActiveTab("sketch")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "sketch"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                  id="tab-sketch-btn"
                >
                  <Ruler className="h-4 w-4" />
                  AutoCAD CAD Sketch
                </button>
                <button
                  onClick={() => setActiveTab("photos")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "photos"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                  id="tab-photos-btn"
                >
                  <Compass className="h-4 w-4" />
                  Maps & Snaps
                </button>
                <button
                  onClick={() => setActiveTab("valuation")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "valuation"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                  id="tab-valuation-btn"
                >
                  <BookOpen className="h-4 w-4" />
                  Valuation Multipliers
                </button>
                <button
                  onClick={() => setActiveTab("report")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "report"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                  id="tab-report-btn"
                >
                  <FileText className="h-4 w-4" />
                  Certified Certificate
                </button>
              </div>

              {/* Workspace Content Panels rendered dynamically */}
              <div className="space-y-6">
                {activeTab === "details" && (
                  <PropertyDetailsForm
                    property={currentProperty}
                    onChangeProperty={handleUpdateCurrentProperty}
                    onGetCurrentGPS={handleCaptureRealGPS}
                    gpsStatus={gpsStatus}
                  />
                )}

                {activeTab === "sketch" && (
                  <AutoCADSketcher
                    points={currentProperty.polygonPoints}
                    onChangePoints={(pts) => handleUpdateCurrentProperty({ polygonPoints: pts })}
                    calculatedArea={currentProperty.calculatedArea}
                    calculatedPerimeter={currentProperty.calculatedPerimeter}
                    onChangeArea={(ar) => handleUpdateCurrentProperty({ calculatedArea: ar })}
                    onChangePerimeter={(per) => handleUpdateCurrentProperty({ calculatedPerimeter: per })}
                    overrideArea={currentProperty.overrideArea}
                    onChangeOverrideArea={(ovr) => handleUpdateCurrentProperty({ overrideArea: ovr })}
                    overridePerimeter={currentProperty.overridePerimeter || null}
                    onChangeOverridePerimeter={(ovr) => handleUpdateCurrentProperty({ overridePerimeter: ovr })}
                  />
                )}

                {activeTab === "photos" && (
                  <MapGPSTracker
                    latitude={currentProperty.latitude}
                    longitude={currentProperty.longitude}
                    onUpdateCoords={(lat, lng) => handleUpdateCurrentProperty({ latitude: lat, longitude: lng })}
                    photos={currentProperty.photoUrls}
                    onUpdatePhotos={(imgs) => handleUpdateCurrentProperty({ photoUrls: imgs })}
                    propertyName={currentProperty.name}
                    propertyAddress={currentProperty.address || `${currentProperty.name}, ${currentProperty.state}, Nigeria`}
                    propertyState={currentProperty.state}
                  />
                )}

                {activeTab === "valuation" && (
                  <div className="grid grid-cols-1 gap-6">
                    {currentProperty.valuationPurpose === "compensation" ? (
                      <CompensationRatesPanel
                        selectedState={currentProperty.state}
                        selectedRateId={currentProperty.selectedRateId}
                        onSelectRate={handleSelectCompensationRate}
                        calculatedArea={currentProperty.overrideArea || currentProperty.calculatedArea}
                      />
                    ) : (
                      <PreviousComparablePanel
                        propertyType={currentProperty.propertyType}
                        state={currentProperty.state}
                        selectedComparableId={currentProperty.selectedComparableId}
                        onSelectComparable={handleSelectMarketComparable}
                        calculatedArea={currentProperty.overrideArea || currentProperty.calculatedArea}
                      />
                    )}
                  </div>
                )}

                {activeTab === "report" && (
                  <MockReportViewer
                    property={currentProperty}
                    selectedRate={selectedRateItem}
                    selectedComparable={selectedComparableItem}
                  />
                )}
              </div>

              {/* Bottom Step Navigation Bar */}
              {(() => {
                const steps: { id: "details" | "sketch" | "photos" | "valuation" | "report"; label: string }[] = [
                  { id: "details", label: "Subject Info" },
                  { id: "sketch", label: "AutoCAD CAD Sketch" },
                  { id: "photos", label: "Maps & Snaps" },
                  { id: "valuation", label: "Valuation Multipliers" },
                  { id: "report", label: "Certified Certificate" }
                ];
                const activeIndex = steps.findIndex(s => s.id === activeTab);
                const prevStep = activeIndex > 0 ? steps[activeIndex - 1] : null;
                const nextStep = activeIndex < steps.length - 1 ? steps[activeIndex + 1] : null;

                return (
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-8 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200" id="step-navigation-bar">
                    <div>
                      {prevStep ? (
                        <button
                          onClick={() => {
                            setActiveTab(prevStep.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="px-4 py-2.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs font-sans"
                          id="prev-step-btn"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Back to {prevStep.label}
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono font-bold uppercase hidden sm:block">
                      STEP {activeIndex + 1} OF {steps.length} • {steps[activeIndex].label.toUpperCase()}
                    </div>

                    <div>
                      {nextStep ? (
                        <button
                          onClick={() => {
                            setActiveTab(nextStep.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-md hover:shadow-lg font-sans"
                          id="next-step-btn"
                        >
                          Continue to {nextStep.label}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-slate-50 border-t border-slate-250 font-sans">
        <div className="flex items-center gap-2">
          <span>VALUFIELD CLIENT GATEWAY</span>
          <span className="text-slate-350">•</span>
          <span>STATION ID: CAD-RSV-LAG</span>
          <span className="text-slate-350">•</span>
          <span className="text-emerald-600 font-bold">● CLOUD PERSISTENCE ACTIVE</span>
        </div>
        <div>
          <span>OFFICIAL VALUATION APP CONTEXT • DEEPMIND INTEGRATED</span>
        </div>
      </footer>
    </div>
  );
}
