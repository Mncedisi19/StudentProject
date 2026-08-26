"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { mapPinColor, PRIORITY_CONFIG } from "@/lib/ui";

// Leaflet's default marker icon paths break under bundlers; we build our
// own colored-dot divIcon instead of shipping the default png marker.
function pinIcon(color, size = 26) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color}; border:3px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function ClickCapture({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnValue({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function MapView({
  mode = "view",
  complaints = [],
  center = [-23.9045, 29.4689], // Polokwane, South Africa default
  zoom = 13,
  height = 480,
  value,
  onChange,
}) {
  const initialCenter = useMemo(() => {
    if (mode === "pick" && value?.lat && value?.lng) return [value.lat, value.lng];
    if (complaints.length > 0) return [complaints[0].latitude, complaints[0].longitude];
    return center;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-sm border border-civic-200">
      <MapContainer center={initialCenter} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mode === "pick" && (
          <>
            <ClickCapture onPick={(lat, lng) => onChange?.(lat, lng)} />
            {value?.lat && value?.lng && (
              <>
                <Marker position={[value.lat, value.lng]} icon={pinIcon("#D98E2B", 30)} />
                <RecenterOnValue lat={value.lat} lng={value.lng} />
              </>
            )}
          </>
        )}

        {mode === "view" &&
          complaints.map((c) => (
            <Marker key={c.id} position={[c.latitude, c.longitude]} icon={pinIcon(mapPinColor(c.status))}>
              <Popup>
                <div className="p-3">
                  {c.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.photo_url} alt="" className="mb-2 h-28 w-full rounded-sm object-cover" />
                  )}
                  <p className="font-display text-sm font-bold text-ink">{c.title}</p>
                  <p className="mt-1 text-xs text-civic-600">{c.address || "Location pinned on map"}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span
                      className="stamp font-semibold"
                      style={{ color: PRIORITY_CONFIG[c.priority]?.color }}
                    >
                      {c.priority}
                    </span>
                    <span className="text-civic-500">👍 {c.me_too_count || 0} Me Too</span>
                  </div>
                  <Link
                    href={`/complaints/${c.id}`}
                    className="mt-2 block rounded-sm bg-civic-800 px-2 py-1.5 text-center text-xs font-semibold text-white hover:bg-civic-700"
                  >
                    View details
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
