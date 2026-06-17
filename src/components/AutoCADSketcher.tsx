import React, { useState, useEffect, useRef } from "react";
import { Point } from "../types";
import { Ruler, Undo, RefreshCw, Scissors, Grid3X3, Zap, Edit3, HelpCircle, Calculator } from "lucide-react";

interface AutoCADSketcherProps {
  points: Point[];
  onChangePoints: (points: Point[]) => void;
  calculatedArea: number;
  calculatedPerimeter: number;
  onChangeArea: (area: number) => void;
  onChangePerimeter: (perimeter: number) => void;
  overrideArea: number | null;
  onChangeOverrideArea: (override: number | null) => void;
  overridePerimeter: number | null;
  onChangeOverridePerimeter: (override: number | null) => void;
}

export default function AutoCADSketcher({
  points,
  onChangePoints,
  calculatedArea,
  calculatedPerimeter,
  onChangeArea,
  onChangePerimeter,
  overrideArea,
  onChangeOverrideArea,
  overridePerimeter,
  onChangeOverridePerimeter
}: AutoCADSketcherProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [draggedNodeIndex, setDraggedNodeIndex] = useState<number | null>(null);
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);
  const [gridSnapping, setGridSnapping] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(10); // 10 pixels = 1 meter
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [manualLengths, setManualLengths] = useState<number[]>([]);
  const [arSimulationActive, setArSimulationActive] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  // Interactive Length & Breadth + Fencing calculator states
  const [lengthInput, setLengthInput] = useState<string>("40");
  const [breadthInput, setBreadthInput] = useState<string>("30");
  const [fenceHeight, setFenceHeight] = useState<string>("2.4"); // Standard block fence height in meters (e.g. 2.4m/8ft)
  const [gateWidth, setGateWidth] = useState<string>("4.0"); // Gate opening deduction in meters
  const [fenceUnitCost, setFenceUnitCost] = useState<string>("5000"); // typical block wall construction cost per linear meter (Naira/USD)

  const handleApplyRectangularLAndB = () => {
    const l = parseFloat(lengthInput);
    const b = parseFloat(breadthInput);
    if (isNaN(l) || isNaN(b) || l <= 0 || b <= 0) return;

    // Generate a centered rectangular plot of l x b in meters
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const wPx = l * scale;
    const hPx = b * scale;

    const rectPoints: Point[] = [
      { x: centerX - wPx / 2, y: centerY - hPx / 2, label: "A" },
      { x: centerX + wPx / 2, y: centerY - hPx / 2, label: "B" },
      { x: centerX + wPx / 2, y: centerY + hPx / 2, label: "C" },
      { x: centerX - wPx / 2, y: centerY + hPx / 2, label: "D" }
    ];

    onChangePoints(rectPoints);
    onChangeOverrideArea(null); // Clear any general override as we now have an exact rectangular plot shape
    onChangeOverridePerimeter(null); 
    setIsClosed(true);
  };

  // Custom snapping interval (e.g. 1 meter in pixels)
  const snapValue = 1; // Snaps to multiples of 1m (which is 1 * scale pixels)

  // Handle ResizeObserver to accommodate responsive resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // set dimensions but constrain to bounds or maintain responsive state
        setDimensions({
          width: Math.max(width, 300),
          height: 380,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync isClosed state based on points
  useEffect(() => {
    if (points.length >= 3) {
      // If of length and first matches last or state is manually closed
      setIsClosed(true);
    } else {
      setIsClosed(false);
    }
  }, [points]);

  // Recalculate Shoelace Area & Perimeter when points or scale changes
  useEffect(() => {
    if (points.length < 3) {
      onChangeArea(0);
      onChangePerimeter(0);
      return;
    }

    // Convert coordinates of points from pixels to meters
    const mPoints = points.map((p) => ({
      x: p.x / scale,
      y: p.y / scale,
      isCurved: p.isCurved,
      curveOffset: p.curveOffset
    }));

    // Perimeter calculation with curvature support
    let perm = 0;
    for (let i = 0; i < mPoints.length; i++) {
      const p1 = mPoints[i];
      const p2 = mPoints[(i + 1) % mPoints.length];
      let dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

      // Parabolic arc approximation: s ≈ chord + (8 * bulge^2) / (3 * chord)
      if (p1.isCurved && p1.curveOffset) {
        const bulge = Math.abs(p1.curveOffset);
        if (dist > 0) {
          dist = dist + (8 * bulge * bulge) / (3 * dist);
        }
      }
      perm += dist;
    }

    // Shoelace Area calculation with curvature segment offsets (outward bulge adds, inward subtracts)
    let areaSum = 0;
    const n = mPoints.length;
    for (let i = 0; i < n; i++) {
      const p1 = mPoints[i];
      const p2 = mPoints[(i + 1) % n];
      areaSum += (p1.x * p2.y) - (p2.x * p1.y);
    }
    let areaVal = Math.abs(areaSum) * 0.5;

    // Adjust for curved boundary segment arcs ≈ (2/3) * chord * bulge height
    for (let i = 0; i < n; i++) {
      const p1 = mPoints[i];
      const p2 = mPoints[(i + 1) % n];
      if (p1.isCurved && p1.curveOffset) {
        const chord = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const bulge = p1.curveOffset;
        const segmentArea = (2 / 3) * chord * bulge;
        areaVal += segmentArea;
      }
    }

    onChangeArea(Number(Math.max(0, areaVal).toFixed(2)));
    onChangePerimeter(Number(perm.toFixed(2)));
  }, [points, scale]);

  // Redraw the AutoCAD Grid Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = "#0f172a"; // Midnight Blue Black background
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw grid lines
    ctx.strokeStyle = "#1e293b"; // Charcoal/Slate grid lines
    ctx.lineWidth = 0.5;
    const gridSize = scale; // 1m subdivision
    const thickGridSize = scale * 5; // 5m thicker lines

    // Vertical grid
    for (let x = 0; x < dimensions.width; x += gridSize) {
      ctx.beginPath();
      ctx.strokeStyle = x % thickGridSize === 0 ? "#334155" : "#1e293b";
      ctx.lineWidth = x % thickGridSize === 0 ? 1 : 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, dimensions.height);
      ctx.stroke();
    }

    // Horizontal grid
    for (let y = 0; y < dimensions.height; y += gridSize) {
      ctx.beginPath();
      ctx.strokeStyle = y % thickGridSize === 0 ? "#334155" : "#1e293b";
      ctx.lineWidth = y % thickGridSize === 0 ? 1 : 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(dimensions.width, y);
      ctx.stroke();
    }

    // Draw scale indicator details
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.fillText(`Scale Grid subdivision: 1.0 meter (${scale}px)`, 15, 25);
    ctx.fillText(`${gridSnapping ? "GRID SNAP: ON" : "GRID SNAP: OFF"}`, 15, 40);

    // Draw shape edges (with curves support)
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        
        // Do not draw last closing line if not closed yet
        if (!isClosed && i === points.length - 1) continue;

        if (p1.isCurved && p1.curveOffset) {
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            // Outward perpendicular vector scaled by curveOffset
            const px = -(dy / len) * (p1.curveOffset * scale);
            const py = (dx / len) * (p1.curveOffset * scale);
            // CP = Midpoint + 2 * offset vector
            const cx = mx + 2 * px;
            const cy = my + 2 * py;
            ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
          } else {
            ctx.lineTo(p2.x, p2.y);
          }
        } else {
          ctx.lineTo(p2.x, p2.y);
        }
      }

      if (isClosed && points.length >= 3) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.15)"; // Sky blue light translucent overlay
        ctx.fill();
        ctx.strokeStyle = "#38bdf8"; // Premium Neon Sky Blue lines
      } else {
        ctx.strokeStyle = "#fdba74"; // Warm amber lines in drawings
      }
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw dimension text along edges
      ctx.font = "11px JetBrains Mono, monospace";
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        
        // Only draw last closing segment line dimension text if shape is closed
        if (!isClosed && i === points.length - 1) continue;

        let mx = (p1.x + p2.x) / 2;
        let my = (p1.y + p2.y) / 2;
        const distM = Math.sqrt(Math.pow((p2.x - p1.x) / scale, 2) + Math.pow((p2.y - p1.y) / scale, 2));
        let arcLen = distM;

        if (p1.isCurved && p1.curveOffset) {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            const px = -(dy / len) * (p1.curveOffset * scale);
            const py = (dx / len) * (p1.curveOffset * scale);
            // Place text slightly centered on curve
            mx += px * 0.8;
            my += py * 0.8;
            
            const bulge = Math.abs(p1.curveOffset);
            arcLen = distM + (8 * bulge * bulge) / (3 * distM);
          }
        }
        
        // Check if there is an override for this side
        const displayLen = p1.overrideLength 
          ? p1.overrideLength.toFixed(1) + "m (Real)" 
          : (p1.isCurved ? `Arc ${arcLen.toFixed(1)}m` : arcLen.toFixed(1) + "m");
        
        // Draw elegant backdrop for dimension numbers
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(mx - 38, my - 8, 76, 16);
        ctx.fillStyle = p1.overrideLength ? "#a855f7" : (p1.isCurved ? "#38bdf8" : "#10b981"); // Purple override, blue arc, green straight
        ctx.textAlign = "center";
        ctx.fillText(displayLen, mx, my + 4);
      }

      // Draw Point nodes
      points.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, idx === hoveredNodeIndex ? 7 : 5, 0, 2 * Math.PI);
        ctx.fillStyle = idx === 0 ? "#ef4444" : "#38bdf8"; // First point is red, others are sky blue
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Node letter tag label e.g., A, B, C
        const label = String.fromCharCode(65 + idx);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, p.x, p.y - 12);
      });
    }
  }, [points, hoveredNodeIndex, isClosed, scale, gridSnapping, dimensions]);

  // Click on canvas adds a node
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeIndex !== null) return; // ignore standard click when finished drag

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked near first point to close polygon
    if (points.length >= 3) {
      const d0 = Math.sqrt(Math.pow(clickX - points[0].x, 2) + Math.pow(clickY - points[0].y, 2));
      if (d0 < 15) {
        setIsClosed(true);
        return;
      }
    }

    // Generate coordinate (possibly snap to grid)
    let finalX = clickX;
    let finalY = clickY;

    if (gridSnapping) {
      const interval = snapValue * scale;
      finalX = Math.round(clickX / interval) * interval;
      finalY = Math.round(clickY / interval) * interval;
    }

    // Add point
    const newPoint: Point = {
      x: finalX,
      y: finalY,
      label: String.fromCharCode(65 + points.length)
    };

    onChangePoints([...points, newPoint]);
  };

  // Node Dragging Handling
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Detect if we clicked directly on an existing node
    const nodeIdx = points.findIndex((p) => {
      const dist = Math.sqrt(Math.pow(clickX - p.x, 2) + Math.pow(clickY - p.y, 2));
      return dist < 12; // hit box
    });

    if (nodeIdx !== -1) {
      setDraggedNodeIndex(nodeIdx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Handle node hover style
    const nodeIdx = points.findIndex((p) => {
      const dist = Math.sqrt(Math.pow(currentX - p.x, 2) + Math.pow(currentY - p.y, 2));
      return dist < 12;
    });
    setHoveredNodeIndex(nodeIdx !== -1 ? nodeIdx : null);

    // Handle Active Dragging coordinate updates
    if (draggedNodeIndex !== null) {
      let finalX = currentX;
      let finalY = currentY;

      if (gridSnapping) {
        const interval = snapValue * scale;
        finalX = Math.round(currentX / interval) * interval;
        finalY = Math.round(currentY / interval) * interval;
      }

      const updatedPoints = [...points];
      updatedPoints[draggedNodeIndex] = {
        ...updatedPoints[draggedNodeIndex],
        x: finalX,
        y: finalY
      };
      onChangePoints(updatedPoints);
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeIndex(null);
  };

  const handleUndo = () => {
    if (points.length === 0) return;
    onChangePoints(points.slice(0, -1));
  };

  const handleClear = () => {
    onChangePoints([]);
    onChangeOverrideArea(null);
    setIsClosed(false);
  };

  // Set real world edge overridden lengths
  const handleEdgeLengthOverride = (idx: number, lenString: string) => {
    const lenVal = parseFloat(lenString);
    if (isNaN(lenVal) || lenVal <= 0) {
      // Clear override
      const updated = [...points];
      delete updated[idx].overrideLength;
      onChangePoints(updated);
      return;
    }

    const updated = [...points];
    updated[idx] = {
      ...updated[idx],
      overrideLength: lenVal
    };
    onChangePoints(updated);

    // Calculate approximate overridden aggregate area. If multiple sides overridden,
    // we can compute a scale coefficient to modify the area value as tape measurements override!
    // Or we provide a handy option to auto-override area directly.
    const averageScaleRatio = updated
      .filter((p) => p.overrideLength)
      .map((p, idx) => {
        const nextP = updated[(idx + 1) % updated.length];
        const distPixels = Math.sqrt(Math.pow(nextP.x - p.x, 2) + Math.pow(nextP.y - p.y, 2));
        const distMeters = distPixels / scale;
        return (p.overrideLength || distMeters) / distMeters;
      });

    if (averageScaleRatio.length > 0) {
      // Simple scaling override calculation: Area is scale ratio squared
      const sumCoeff = averageScaleRatio.reduce((a, b) => a + b, 0) / averageScaleRatio.length;
      const adjustedArea = calculatedArea * Math.pow(sumCoeff, 2);
      onChangeOverrideArea(Number(adjustedArea.toFixed(2)));
    }
  };

  // Set coordinate in meters directly from numerical input box
  const handleCoordinateInputChange = (idx: number, axis: "x" | "y", valString: string) => {
    const val = parseFloat(valString);
    if (isNaN(val)) return;
    const updated = [...points];
    updated[idx] = {
      ...updated[idx],
      [axis]: val * scale
    };
    onChangePoints(updated);
  };

  // Simulate AR (Augmented Reality) Camera scan measurements to populate polygon points for demonstration on Android!
  const triggerArSimulation = () => {
    setArSimulationActive(true);
    // Simulate finding a clean rectangular/polygonal building parcel automatically:
    setTimeout(() => {
      // Coordinates of a 15m x 10m building starting around center
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const wPx = 15 * scale;
      const hPx = 10 * scale;

      const simulatedPoints: Point[] = [
        { x: centerX - wPx/2, y: centerY - hPx/2, label: "A" },
        { x: centerX + wPx/2, y: centerY - hPx/2, label: "B" },
        { x: centerX + wPx/2, y: centerY + hPx/2, label: "C" },
        { x: centerX - wPx/2, y: centerY + hPx/2, label: "D" }
      ];

      onChangePoints(simulatedPoints);
      setArSimulationActive(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm" id="autocad-sketcher-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Ruler className="text-sky-600 h-5 w-5" />
            AutoCAD property land sketch
          </h3>
          <p className="text-sm text-slate-500">
            Click on grid to add corner plot boundary nodes. Drag nodes to reshape, or insert tape measures to override.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGridSnapping(!gridSnapping)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              gridSnapping ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title="Snap coordinates to 1-meter cells"
            id="toggle-snap-btn"
          >
            <Grid3X3 className="h-3 w-3" />
            {gridSnapping ? "Snap Grid: On (1m)" : "Snap Grid: Off"}
          </button>
          <button
            onClick={triggerArSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              arSimulationActive ? "bg-amber-100 text-amber-700 animate-pulse" : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
            }`}
            title="Use device camera AR distance measurements override"
            id="ar-tape-override"
          >
            <Zap className="h-3 w-3" />
            {arSimulationActive ? "AR Laser Scanning..." : "AR Tape Measurement Scan"}
          </button>
          <button
            onClick={handleUndo}
            disabled={points.length === 0}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
            title="Undo last node"
            id="undo-node-btn"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
            title="Clear drawing sketch"
            id="clear-sketch-btn"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Drawing Stage */}
        <div className="lg:col-span-2 flex flex-col gap-2" ref={containerRef}>
          <div className="relative border border-slate-900 rounded-xl overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full cursor-crosshair block"
              id="autocad-interactive-canvas"
            />
            {points.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs text-white p-6 text-center pointer-events-none">
                <Ruler className="text-blue-550 h-10 w-10 mb-2 animate-bounce" />
                <p className="font-semibold text-sm">Land Sketch Area is Ready</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Start drawing boundary lines by clicking anywhere on the black CAD plotting mesh grid.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-slate-400" />
              Tip: Draw in a loop clockwise. Re-click Node A to fully seal the shape.
            </span>
            <div className="flex items-center gap-4">
              <span>Zoom Scale:</span>
              <input
                type="range"
                min="6"
                max="24"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-20 accent-blue-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
              />
              <span className="font-mono">{scale}px/m</span>
            </div>
          </div>
        </div>

        {/* Real-time metrics and CAD sidebar overrides */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Calculated Plot Metrics
            </h4>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-400 block">Total Area</span>
                <span className="text-lg font-bold font-mono text-slate-800">
                  {calculatedArea} <span className="text-xs font-normal">m²</span>
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-400 block">Perimeter</span>
                <span className="text-lg font-bold font-mono text-slate-800">
                  {calculatedPerimeter} <span className="text-xs font-normal">m</span>
                </span>
              </div>
            </div>

            {/* Direct overriding interface for Area & Perimeter */}
            <div className="bg-white p-4 rounded-lg border border-slate-100 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Area Override */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Edit3 className="h-3 w-3 text-slate-505" />
                      Override Area
                    </span>
                    {overrideArea !== null && (
                      <button
                        onClick={() => onChangeOverrideArea(null)}
                        className="text-[9px] text-red-500 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 150.0"
                      value={overrideArea !== null ? overrideArea : ""}
                      onChange={(e) => onChangeOverrideArea(e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full pl-2 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:border-blue-600 focus:ring-1"
                      id="override-area-input"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-400">m²</span>
                  </div>
                </div>

                {/* Perimeter Override */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Edit3 className="h-3 w-3 text-slate-505" />
                      Override Perimeter
                    </span>
                    {overridePerimeter !== null && (
                      <button
                        onClick={() => onChangeOverridePerimeter(null)}
                        className="text-[9px] text-red-500 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="relative font-mono">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 50.0"
                      value={overridePerimeter !== null ? overridePerimeter : ""}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : null;
                        onChangeOverridePerimeter(val);
                        if (val !== null) {
                          onChangePerimeter(val);
                        }
                      }}
                      className="w-full pl-2 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:border-blue-600 focus:ring-1"
                      id="override-perimeter-input"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-400">m</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                If physical tape layout reports exact totals (due to slopes/obstacles), enter them here to override drawing values.
              </p>
            </div>

            {/* Interactive Length & Breadth + Fencing cost formulation and arithmetic calculator */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-2xs" id="lb-fence-calculator-card">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Calculator className="h-4 w-4 text-blue-600 shrink-0" />
                <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Standard L × B & Fence Arithmetic
                </h5>
              </div>

              <div className="text-[11px] text-slate-500 leading-normal space-y-1 bg-slate-50 p-2.5 rounded border border-slate-150">
                <p className="font-semibold text-slate-700 leading-relaxed">Formulation arithmetic:</p>
                <div className="font-mono text-[9.5px] space-y-0.5 text-blue-800">
                  <div>• Area (A) = Length × Breadth (m²)</div>
                  <div>• Perimeter (P) = 2 × (Length + Breadth) (m)</div>
                  <div>• Wall Blocks = Wall Area × 10 blocks/m²</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-extrabold text-slate-550 uppercase tracking-wide mb-1 font-mono">
                    Plot L (meters)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 40"
                    value={lengthInput}
                    onChange={(e) => setLengthInput(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-250 rounded text-xs font-mono focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-extrabold text-slate-550 uppercase tracking-wide mb-1 font-mono">
                    Plot B (meters)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 30"
                    value={breadthInput}
                    onChange={(e) => setBreadthInput(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-250 rounded text-xs font-mono focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase font-mono mb-1" title="Height of the boundary block wall fence">
                    Fence Ht (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={fenceHeight}
                    onChange={(e) => setFenceHeight(e.target.value)}
                    className="w-full px-1.5 py-1 border border-slate-250 rounded text-[11px] font-mono focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase font-mono mb-1" title="Subtracted width of the entrance gate">
                    Gate Ded. (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={gateWidth}
                    onChange={(e) => setGateWidth(e.target.value)}
                    className="w-full px-1.5 py-1 border border-slate-250 rounded text-[11px] font-mono focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase font-mono mb-1" title="Approximate bricklaying cost per linear meter length">
                    Rate (₦/m)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={fenceUnitCost}
                    onChange={(e) => setFenceUnitCost(e.target.value)}
                    className="w-full px-1.5 py-1 border border-slate-250 rounded text-[11px] font-mono focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyRectangularLAndB}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-[10.5px] rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                id="apply-lb-rect-plot-btn"
              >
                <Zap className="h-3.5 w-3.5 shrink-0 text-amber-300 fill-amber-300" />
                Plot & Draw Coordinates on CAD
              </button>

              {/* LIVE COMPUTATION OF SURFACE AREA AND FENCE BOUNDARY */}
              {(() => {
                const l = parseFloat(lengthInput) || 0;
                const b = parseFloat(breadthInput) || 0;
                const h = parseFloat(fenceHeight) || 0;
                const gate = parseFloat(gateWidth) || 0;
                const costPerM = parseFloat(fenceUnitCost) || 0;

                // Priority: Use manual overrides first if entered, otherwise use CAD calculated properties,
                // otherwise fallback to simple length X breadth rectangle formulation!
                const activePerimeter = overridePerimeter !== null 
                  ? overridePerimeter 
                  : (calculatedPerimeter > 0 ? calculatedPerimeter : (2 * (l + b)));
                const activeArea = overrideArea !== null 
                  ? overrideArea 
                  : (calculatedArea > 0 ? calculatedArea : (l * b));

                const netFenceLength = Math.max(0, activePerimeter - gate);
                const wallArea = netFenceLength * h;
                const totalBlocksRequired = Math.round(wallArea * 10); // Standard civil engineering estimation: 10 blocks per m²
                const estimatedCost = netFenceLength * costPerM;

                return (
                  <div className="border-t border-slate-100 pt-3.5 space-y-2 text-xs">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block font-mono">Live Computed Appraisal Estimates:</span>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div className="bg-slate-50 p-2 rounded border border-slate-150">
                        <span className="text-[9px] text-slate-400 block uppercase">Area Formulation</span>
                        <strong className="text-slate-800 text-[11.5px]">{activeArea.toFixed(1)} m²</strong>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {overrideArea !== null ? "(Manual Override)" : (calculatedArea > 0 ? "CAD Path" : `(${l}m × ${b}m)`)}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-150">
                        <span className="text-[9px] text-slate-400 block uppercase">Fence Perimeter</span>
                        <strong className="text-indigo-700 text-[11.5px]">{activePerimeter.toFixed(1)} m</strong>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {overridePerimeter !== null ? "(Manual Override)" : (calculatedPerimeter > 0 ? "CAD Selected" : `2 × (${l} + ${b})`)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-55 border border-slate-200 rounded p-2.5 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold">Net Fence Wall Length:</span>
                        <span className="font-bold text-slate-800 font-mono">{netFenceLength.toFixed(1)} m</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                        <span>• Gate Deduction:</span>
                        <span>-{gate} m</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                        <span>• Wall Area ({h}m Ht):</span>
                        <span>{wallArea.toFixed(1)} m²</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                        <span>• Est. Blocks (9" 10/m²):</span>
                        <span className="font-bold text-slate-700">{totalBlocksRequired.toLocaleString()} blocks</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200 font-sans">
                        <span className="font-semibold text-slate-700">Est. Fence cost rate:</span>
                        <span className="font-mono font-bold text-emerald-600">₦ {estimatedCost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Direct coordinate numerical adjustments */}
            {points.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-slate-100 space-y-3 mt-3">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                  <span>Numeric Node Coordinates (X/Y)</span>
                  <span className="text-[9px] text-slate-400 font-normal normal-case">Edit meters to reshape</span>
                </h5>
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                  {points.map((p, idx) => {
                    const xM = Number((p.x / scale).toFixed(1));
                    const yM = Number((p.y / scale).toFixed(1));
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs" id={`node-coord-row-${idx}`}>
                        <span className="font-bold w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-slate-700 font-mono text-[10px]">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-1">
                            <span className="text-[9px] font-mono text-slate-400">X:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={xM}
                              onChange={(e) => handleCoordinateInputChange(idx, "x", e.target.value)}
                              className="w-full bg-transparent font-mono text-xs focus:outline-none text-right"
                            />
                            <span className="text-[9px] font-mono text-slate-400">m</span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-1">
                            <span className="text-[9px] font-mono text-slate-400">Y:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={yM}
                              onChange={(e) => handleCoordinateInputChange(idx, "y", e.target.value)}
                              className="w-full bg-transparent font-mono text-xs focus:outline-none text-right"
                            />
                            <span className="text-[9px] font-mono text-slate-400">m</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Individual CAD side segment overrides */}
          {points.length >= 2 && (
            <div className="flex-1 max-h-[290px] overflow-y-auto border border-slate-200 rounded-lg p-3 bg-white space-y-2">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono flex justify-between items-center">
                <span>AutoCAD Edge Metrics & Curvature</span>
                <span className="text-[9px] text-slate-400 font-normal">More than 4-sides & arcs supported</span>
              </h5>
              {points.map((p, idx) => {
                const nextP = points[(idx + 1) % points.length];
                const segmentName = `${String.fromCharCode(65 + idx)} - ${String.fromCharCode(65 + ((idx + 1) % points.length))}`;
                const autoLen = Math.sqrt(Math.pow((nextP.x - p.x) / scale, 2) + Math.pow((nextP.y - p.y) / scale, 2));

                if (!isClosed && idx === points.length - 1) return null;

                return (
                  <div key={idx} className="border-b border-slate-100 pb-2 mb-2 last:border-0 last:pb-0 font-sans" id={`side-control-${idx}`}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        Side {segmentName}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        CAD: {autoLen.toFixed(1)}m
                      </span>
                      <div className="w-20">
                        <input
                          type="number"
                          placeholder="Real (m)"
                          step="0.1"
                          value={p.overrideLength || ""}
                          onChange={(e) => handleEdgeLengthOverride(idx, e.target.value)}
                          className="w-full text-right p-1 border border-slate-250 rounded font-mono text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-650"
                          title="Enter custom tape measurement to override edge calculation"
                        />
                      </div>
                    </div>
                    {/* Curve/Arc Controls */}
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!p.isCurved}
                          onChange={(e) => {
                            const updated = [...points];
                            updated[idx] = {
                              ...updated[idx],
                              isCurved: e.target.checked,
                              curveOffset: e.target.checked ? 3 : 0,
                            };
                            onChangePoints(updated);
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        Curve Edge?
                      </label>
                      {p.isCurved && (
                        <div className="flex items-center gap-2 flex-1 ml-4">
                          <input
                            type="range"
                            min="-8"
                            max="8"
                            step="0.5"
                            value={p.curveOffset || 3}
                            onChange={(e) => {
                              const updated = [...points];
                              updated[idx] = {
                                ...updated[idx],
                                curveOffset: parseFloat(e.target.value),
                              };
                              onChangePoints(updated);
                            }}
                            className="w-full accent-blue-600 h-1 cursor-pointer bg-slate-100 rounded"
                          />
                          <span className="font-mono text-[9px] w-8 text-right bg-slate-50 px-1 border border-slate-150 rounded">
                            {(p.curveOffset || 3) > 0 ? "+" : ""}{(p.curveOffset || 3).toFixed(1)}m
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
