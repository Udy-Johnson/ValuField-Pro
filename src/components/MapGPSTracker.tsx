import React, { useState } from "react";
import { Compass, MapPin, Camera, Trash2, Image, Maximize2, X } from "lucide-react";

interface MapGPSTrackerProps {
  latitude: number | null;
  longitude: number | null;
  onUpdateCoords: (lat: number, lng: number) => void;
  photos: string[];
  onUpdatePhotos: (photos: string[]) => void;
  propertyName?: string;
  propertyAddress?: string;
  propertyState?: string;
}

// Format date and time to match professional GPS uploader style exactly.
export function getCurrentFormattedDateTime(): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const now = new Date();
  const dayName = days[now.getDay()];
  
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  
  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const hDisplay = String(hours).padStart(2, '0');
  const mDisplay = String(now.getMinutes()).padStart(2, '0');
  
  return `${dayName}, ${dd}/${mm}/${yyyy} ${hDisplay}:${mDisplay} ${ampm} GMT+01:00`;
}

// GPS Cam watermark badge container
export function GPSCameraWatermark({
  lat,
  lng,
  address,
  name,
  stateName,
  compact = false
}: {
  lat: number | null;
  lng: number | null;
  address: string;
  name: string;
  stateName: string;
  compact?: boolean;
}) {
  const latitudeVal = lat !== null ? lat : 4.613003;
  const longitudeVal = lng !== null ? lng : 7.947282;
  const displayState = stateName || "Akwa Ibom";
  const displayAddress = address || "Kwa Ibo Rd, Central 1, Uyo, Akwa Ibom State, Nigeria";
  const formattedDateTime = getCurrentFormattedDateTime(); 

  return (
    <div className={`absolute bottom-0 left-0 right-0 bg-black/75 text-white p-2 flex gap-2 items-center backdrop-blur-md select-none font-sans text-left z-20 pointer-events-none border-t border-white/10 ${compact ? 'py-1 px-1.5' : 'py-2 px-3'}`}>
      {/* Left side: Mini-Google Map Simulated Block */}
      <div className={`shrink-0 bg-slate-900 border border-white/35 rounded flex items-center justify-center relative overflow-hidden ${compact ? 'w-8 h-8' : 'w-12 h-12'}`}>
        {/* Simulating satellite green grid dots */}
        <div className="absolute inset-0 opacity-40 bg-radial" 
          style={{
            backgroundImage: "radial-gradient(#10b981 1.5px, transparent 1.5px)",
            backgroundSize: "4px 4px"
          }}
        />
        {/* Red Pin inside map */}
        <div className="absolute h-1.5 w-1.5 bg-red-500 rounded-full animate-ping" />
        <div className="absolute h-1.5 w-1.5 bg-red-600 rounded-full" />
        {/* Small Google Watermark Label */}
        <span className="absolute bottom-[0.5px] left-0 right-0 text-center font-mono font-black text-[5px] tracking-tighter opacity-90 text-white">
          Google
        </span>
      </div>

      {/* Right side: GPS Info Details */}
      <div className="flex-1 min-w-0" style={{ fontSize: compact ? '7px' : '9px' }}>
        <h4 className={`font-bold text-white truncate flex items-center gap-1 leading-none ${compact ? 'text-[8px] mb-0.5' : 'text-[10px] mb-1'}`}>
          <span>{displayState || "Akwa Ibom State"}, Nigeria</span>
          <span>🇳🇬</span>
        </h4>
        <p className="text-slate-300 truncate leading-none mt-0.5" title={displayAddress}>
          {displayAddress}
        </p>
        <p className="text-slate-300 font-medium font-mono leading-none mt-0.5">
          Lat {latitudeVal.toFixed(6)}° Long {longitudeVal.toFixed(6)}°
        </p>
        <p className="text-amber-400 font-mono leading-none mt-0.5" style={{ fontSize: compact ? '6.5px' : '8.5px' }}>
          {formattedDateTime}
        </p>
      </div>

      {/* GPS Camera Yellow Badge on Top Right of overlay block */}
      {!compact && (
        <div className="absolute top-1 right-1.5 bg-yellow-400 text-[6.5px] font-extrabold text-slate-950 px-1 py-[0.5px] rounded tracking-wider flex items-center gap-0.5">
          <span className="w-1 h-1 bg-slate-950 rounded-full animate-pulse" />
          <span>GPS MAP CAMERA</span>
        </div>
      )}
    </div>
  );
}

export default function MapGPSTracker({
  latitude,
  longitude,
  onUpdateCoords,
  photos,
  onUpdatePhotos,
  propertyName = "Subject property",
  propertyAddress = "Kwa Ibo Rd, Central 1, Uyo, Akwa Ibom State, Nigeria",
  propertyState = "Akwa Ibom"
}: MapGPSTrackerProps) {
  const [mapStyle, setMapStyle] = useState<"satellite" | "cad-terrain">("satellite");
  const [capturingPhoto, setCapturingPhoto] = useState<boolean>(false);
  const [selectedZoomPhoto, setSelectedZoomPhoto] = useState<string | null>(null);

  // Drag map simulation coordinates adjustment
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixel mapping to reasonable latitude/longitude coordinates (Lekki / Lagos Central reference point)
    const baseLat = 6.4281;
    const baseLng = 3.4219;
    const deltaLat = ((y - rect.height / 2) / rect.height) * -0.01;
    const deltaLng = ((x - rect.width / 2) / rect.width) * 0.01;

    onUpdateCoords(baseLat + deltaLat, baseLng + deltaLng);
  };

  // Capture simulated snapshot mock
  const handleCaptureSimulatedPhoto = () => {
    setCapturingPhoto(true);

    const mockPhotoStock = [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80", // Modern residential building
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80", // Modern villa
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80", // Premium structure
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"  // Luxury gatehouse/blockwork
    ];

    setTimeout(() => {
      // Pick random mock photo
      const randomUrl = mockPhotoStock[Math.floor(Math.random() * mockPhotoStock.length)];
      onUpdatePhotos([...photos, randomUrl]);
      setCapturingPhoto(false);
    }, 1000);
  };

  // Upload custom local files
  const handleLocalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          onUpdatePhotos([...photos, reader.result.toString()]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (idx: number) => {
    onUpdatePhotos(photos.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-6" id="map-gps-tracker-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Compass className="text-blue-600 h-5 w-5" />
            Field Photos & GPS Telemetry
          </h3>
          <p className="text-xs text-slate-500">
            Pin spatial boundaries on the satellite grid overlay and attach inspection snapshots.
          </p>
        </div>

        {/* Style configurations */}
        <div className="bg-slate-100 p-1 rounded-md flex self-start border border-slate-200">
          <button
            onClick={() => setMapStyle("satellite")}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
              mapStyle === "satellite" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Satellite View
          </button>
          <button
            onClick={() => setMapStyle("cad-terrain")}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
              mapStyle === "cad-terrain" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            CAD Grid
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mock Interactive Satellite Map Layout */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Spatio-Temporal Mapping Grid</span>
          <div
            onClick={handleMapClick}
            className={`h-[280px] rounded-lg relative overflow-hidden cursor-crosshair border border-slate-300 select-none shadow-inner flex items-center justify-center`}
            style={{
              backgroundImage:
                mapStyle === "satellite"
                  ? "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80')" // Deep dark global pattern
                  : "radial-gradient(#e2e8f0 1.5px, transparent 1.5px)",
              backgroundSize: mapStyle === "satellite" ? "cover" : "20px 20px",
              backgroundColor: mapStyle === "satellite" ? "#020617" : "#f8fafc"
            }}
            id="gps-simulation-map-canvas"
          >
            {/* Visual scanline/crosshair radar overlay */}
            <div className="absolute inset-0 border border-dashed border-blue-500/10 pointer-events-none" />
            
            {latitude !== null && longitude !== null ? (
              <div
                className="absolute flex flex-col items-center justify-center text-center transform -translate-y-1/2 -translate-x-1/2 cursor-grab"
                style={{ left: "50%", top: "50%" }}
              >
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-10 w-10 bg-red-400/30 rounded-full animate-ping pointer-events-none" />
                  <MapPin className="text-red-600 h-8 w-8 filter drop-shadow-md relative z-10" />
                </div>
                <div className="bg-slate-900/95 text-[10px] font-mono text-white mt-1.5 px-2.5 py-1 rounded border border-slate-800 backdrop-blur-xs relative z-10 shadow-xs leading-normal">
                  <span className="font-bold text-emerald-400">● PINNED</span>
                  <br />
                  <span>Lat: {latitude.toFixed(5)}</span>
                  <br />
                  <span>Lng: {longitude.toFixed(5)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 bg-slate-950/80 backdrop-blur-xs text-white rounded-lg max-w-xs border border-slate-800 pointer-events-none">
                <Compass className="h-7 w-7 mx-auto text-blue-400 mb-2 animate-spin-slow" />
                <h4 className="text-xs font-semibold">Identify Parcel Placement</h4>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Click anywhere on the satellite matrix landscape to lock real-time coordinates.
                </p>
              </div>
            )}
            
            {/* Compass rose compass overlay */}
            <div className="absolute bottom-3 right-3 bg-white/95 p-1.5 rounded border border-slate-200 shadow-xs pointer-events-none">
              <Compass className="h-4.5 w-4.5 text-slate-700 animate-spin-slow" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 block text-center leading-normal font-mono uppercase tracking-wider">
            Manually tap coordinates on viewport to position the surveyor node
          </span>
        </div>

        {/* Camera / Photo log uploader workspace */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono font-bold">Verified Geotagged Site Imagery</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((src, idx) => (
              <div key={idx} className="relative group rounded-lg border border-slate-250 overflow-hidden h-[150px] bg-slate-900 shadow-sm transition-all hover:shadow hover:border-slate-400 group" id={`photo-thumbnail-${idx}`}>
                <img
                  src={src}
                  alt={`Subject Site ${idx}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Embedded GPS Watermark overlay */}
                <GPSCameraWatermark
                  lat={latitude}
                  lng={longitude}
                  address={propertyAddress}
                  name={propertyName}
                  stateName={propertyState}
                  compact={true}
                />

                {/* Operations tools on image hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-start justify-between p-2 z-30">
                  <button
                    onClick={() => setSelectedZoomPhoto(src)}
                    className="p-1.5 bg-slate-900/85 hover:bg-slate-950 hover:scale-105 text-white rounded cursor-pointer transition-all shadow-sm"
                    title="Zoom watermark display"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemovePhoto(idx)}
                    className="p-1.5 bg-red-600 hover:bg-red-700 hover:scale-105 text-white rounded shadow-sm cursor-pointer transition-all"
                    title="Remove image log"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Simulated uploader inputs */}
            <div className="border border-dashed border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100/50 transition-all text-center h-[150px] relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleLocalPhotoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                id="photo-file-selector"
              />
              <Camera className="h-5 w-5 text-slate-400 mb-1" />
              <span className="text-[10px] font-semibold text-slate-700 block">Upload Local Photos</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Device media browser</span>
            </div>

            <button
              onClick={handleCaptureSimulatedPhoto}
              disabled={capturingPhoto}
              className="border border-dashed border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100/50 transition-all text-center h-[150px] disabled:opacity-40"
              id="capture-photo-simulate"
            >
              {capturingPhoto ? (
                <>
                  <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-1" />
                  <span className="text-[10px] font-semibold text-blue-600 animate-pulse">Capturing Snapshot...</span>
                </>
              ) : (
                <>
                  <Image className="h-5 w-5 text-slate-400 mb-1" />
                  <span className="text-[10px] font-semibold text-slate-700 block">Simulate Field Camera</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Camera app overlay</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
            * Photos will automatically carry a stamped **GPS Camera Watermark** including live satellite position grids, standard timestamps, address mapping, and country indicators for surveyors compliance.
          </p>
        </div>
      </div>

      {/* Fullscreen High-Resolution Zoom GPS Watermark Preview modal */}
      {selectedZoomPhoto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-slate-900 overflow-hidden rounded-2xl max-w-2xl w-full border border-slate-800 shadow-2xl flex flex-col">
            <div className="absolute right-3 top-3 z-40 bg-slate-950/80 text-white rounded-full p-1.5 hover:bg-red-650 cursor-pointer transition-all" onClick={() => setSelectedZoomPhoto(null)}>
              <X className="h-4 w-4" />
            </div>

            <div className="relative w-full aspect-video bg-slate-950">
              <img
                src={selectedZoomPhoto}
                alt="Geotagged Survey Snapshot Fullscreen"
                className="w-full h-full object-contain"
                referrerPolicy="referrer"
              />

              {/* Master Full GPS Watermark Overlay */}
              <GPSCameraWatermark
                lat={latitude}
                lng={longitude}
                address={propertyAddress}
                name={propertyName}
                stateName={propertyState}
                compact={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
