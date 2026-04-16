"use client";

import { divIcon, Map as LeafletMap } from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import MarkerClusterGroup from "react-leaflet-cluster";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { Log } from "../services/api";

interface Props {
  logs: Log[];
}

interface GeoLog extends Log {
  latitude: number;
  longitude: number;
}

interface IpPoint {
  sourceIp: string;
  latitude: number;
  longitude: number;
  displayLatitude: number;
  displayLongitude: number;
  country: string;
  totalEvents: number;
  maliciousCount: number;
  suspiciousCount: number;
  normalCount: number;
  logs: GeoLog[];
}

const MAP_CENTER: [number, number] = [20, 0];
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [-85, -180],
  [85, 180],
];
const GOLDEN_ANGLE = 2.399963229728653;

function hasGeoPoint(log: Log): log is GeoLog {
  return typeof log.latitude === "number" && typeof log.longitude === "number";
}

function timestampValue(timestamp?: string | null) {
  if (!timestamp) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function markerClassName(point: IpPoint) {
  if (point.maliciousCount > 0) {
    return "threat-point-dot threat-point-high";
  }

  if (point.suspiciousCount > 0) {
    return "threat-point-dot threat-point-medium";
  }

  return "threat-point-dot threat-point-low";
}

function popupThreatClassName(point: IpPoint) {
  if (point.maliciousCount > 0) {
    return "map-threat-popup map-threat-popup-high";
  }

  if (point.suspiciousCount > 0) {
    return "map-threat-popup map-threat-popup-medium";
  }

  return "map-threat-popup map-threat-popup-low";
}

function markerIcon(point: IpPoint) {
  return divIcon({
    className: "threat-point-icon",
    html: `<span class="${markerClassName(point)}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

function formatPopupTime(timestamp?: string | null) {
  if (!timestamp) {
    return "Unknown time";
  }

  return timestamp.replace("T", " ").split(".")[0];
}

function classificationBadgeClass(classification: string) {
  if (classification === "Malicious") {
    return "map-point-badge threat-high";
  }

  if (classification === "Suspicious") {
    return "map-point-badge threat-medium";
  }

  return "map-point-badge threat-low";
}

function dominantCountry(logs: GeoLog[]) {
  const counts: Record<string, number> = {};

  logs.forEach((log) => {
    const country = log.country ?? "Unknown";
    counts[country] = (counts[country] ?? 0) + 1;
  });

  const [country = "Unknown"] = Object.entries(counts).sort(
    (a, b) => b[1] - a[1],
  )[0] ?? ["Unknown"];

  return country;
}

function distributeOverlappingPoints(points: IpPoint[]) {
  const grouped = new Map<string, IpPoint[]>();

  points.forEach((point) => {
    const key = `${point.latitude.toFixed(4)}:${point.longitude.toFixed(4)}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.push(point);
      return;
    }

    grouped.set(key, [point]);
  });

  grouped.forEach((group) => {
    if (group.length <= 1) {
      return;
    }

    group.forEach((point, index) => {
      const distance = 0.12 * Math.sqrt(index + 1);
      const angle = index * GOLDEN_ANGLE;

      point.displayLatitude = point.latitude + distance * Math.sin(angle);

      const longitudeScale = Math.max(
        0.35,
        Math.abs(Math.cos((point.latitude * Math.PI) / 180)),
      );

      point.displayLongitude =
        point.longitude + (distance * Math.cos(angle)) / longitudeScale;
    });
  });

  return points;
}

function fitMapToPoints(map: LeafletMap, points: [number, number][]) {
  if (points.length === 0) {
    map.setView(MAP_CENTER, 2);
    return;
  }

  map.fitBounds(points, {
    padding: [30, 30],
  });
}

function AutoFit({ points }: { points: [number, number][] }) {
  const map = useMap();
  const hasAutoFitted = useRef(false);

  useEffect(() => {
    if (hasAutoFitted.current) {
      return;
    }

    fitMapToPoints(map, points);
    hasAutoFitted.current = true;
  }, [map, points]);

  return null;
}

export default function ThreatMap({ logs }: Props) {
  const mapRef = useRef<LeafletMap | null>(null);
  const geoLogs = useMemo(() => logs.filter(hasGeoPoint), [logs]);

  const points = useMemo<IpPoint[]>(() => {
    const grouped = new Map<string, GeoLog[]>();

    geoLogs.forEach((log) => {
      const existing = grouped.get(log.source_ip);

      if (existing) {
        existing.push(log);
        return;
      }

      grouped.set(log.source_ip, [log]);
    });

    const rawPoints = Array.from(grouped.entries()).map(([sourceIp, ipLogs]) => {
      const sorted = [...ipLogs].sort(
        (a, b) => timestampValue(b.timestamp) - timestampValue(a.timestamp),
      );
      const latest = sorted[0] ?? ipLogs[0];
      const maliciousCount = ipLogs.filter(
        (log) => log.classification === "Malicious",
      ).length;
      const suspiciousCount = ipLogs.filter(
        (log) => log.classification === "Suspicious",
      ).length;

      return {
        sourceIp,
        latitude: latest.latitude,
        longitude: latest.longitude,
        displayLatitude: latest.latitude,
        displayLongitude: latest.longitude,
        country: dominantCountry(ipLogs),
        totalEvents: ipLogs.length,
        maliciousCount,
        suspiciousCount,
        normalCount: ipLogs.length - maliciousCount - suspiciousCount,
        logs: sorted,
      };
    });

    return distributeOverlappingPoints(rawPoints);
  }, [geoLogs]);

  const fitPoints = useMemo(
    () =>
      points.map(
        (point) => [point.displayLatitude, point.displayLongitude] as [number, number],
      ),
    [points],
  );

  const handleAutoFitClick = () => {
    if (!mapRef.current) {
      return;
    }

    fitMapToPoints(mapRef.current, fitPoints);
  };

  return (
    <div className="panel-section">
      <div className="panel-title">MAP</div>

      <div className="map-shell">
        <MapContainer
          ref={mapRef}
          center={MAP_CENTER}
          zoom={2}
          maxBounds={MAP_BOUNDS}
          maxBoundsViscosity={1}
          worldCopyJump={false}
          style={{
            height: "360px",
            width: "100%",
          }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            noWrap={true}
          />

          <AutoFit points={fitPoints} />

          <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={false}
            disableClusteringAtZoom={8}
            zoomToBoundsOnClick={true}
          >
            {points.map((point) => (
              <Marker
                key={point.sourceIp}
                position={[point.displayLatitude, point.displayLongitude]}
                icon={markerIcon(point)}
              >
                <Popup maxWidth={320} className={popupThreatClassName(point)}>
                  <strong>{point.sourceIp}</strong>
                  <br />
                  {point.country}
                  <br />
                  {`Total events: ${point.totalEvents}`}
                  <br />
                  {`Malicious: ${point.maliciousCount} | Suspicious: ${point.suspiciousCount} | Normal: ${point.normalCount}`}
                  <div className="map-point-list-title">Events For This IP</div>
                  <ul
                    className={`map-point-list${
                      point.logs.length > 8 ? " map-point-list-scrollable" : ""
                    }`}
                  >
                    {point.logs.map((log, index) => (
                      <li
                        key={`${point.sourceIp}-${log.id ?? index}-${log.timestamp ?? index}`}
                        className="map-point-list-item"
                      >
                        <span className={classificationBadgeClass(log.classification)}>
                          {log.classification}
                        </span>
                        <span className="map-point-list-time">
                          {formatPopupTime(log.timestamp)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>

        <button
          type="button"
          className="map-autofit-btn"
          onClick={handleAutoFitClick}
          aria-label="Auto-fit map to all visible threat points"
        >
          Auto-Fit
        </button>
      </div>
    </div>
  );
}
