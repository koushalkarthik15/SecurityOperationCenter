"use client";

import { MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";

import { Log } from "../services/api";

interface Props {
  logs: Log[];
}

interface ThreatRow {
  ip: string;
  country: string;
  requests: number;
  maxScore: number;
  avgScore: number;
  lastSeen: string | null | undefined;
  latestClassification: string;
  worstClassification: string;
  emailAlerts: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface IpPopupState {
  left: number;
  top: number;
  row: ThreatRow;
}

function maskIp(ip: string) {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return ip;
  }

  return `${parts[0]}.${parts[1]}.x.x`;
}

function severityClass(score: number) {
  if (score >= 85) {
    return "threat-high";
  }

  if (score >= 45) {
    return "threat-medium";
  }

  return "threat-low";
}

function formatTimestampDetails(timestamp?: string | null) {
  if (!timestamp) {
    return "N/A";
  }

  return `${timestamp.replace("T", " ").split(".")[0]} UTC`;
}

function formatCoordinate(value?: number | null) {
  if (typeof value !== "number") {
    return "N/A";
  }

  return value.toFixed(4);
}

function timestampValue(timestamp?: string | null) {
  if (!timestamp) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

export default function TopThreats({ logs }: Props) {
  const [activePopup, setActivePopup] = useState<IpPopupState | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const grouped: Record<
    string,
    {
      logs: Log[];
      countryCounts: Record<string, number>;
    }
  > = {};

  logs.forEach((log) => {
    if (!grouped[log.source_ip]) {
      grouped[log.source_ip] = {
        logs: [],
        countryCounts: {},
      };
    }

    grouped[log.source_ip].logs.push(log);

    const countryKey = log.country ?? "Unknown";
    grouped[log.source_ip].countryCounts[countryKey] =
      (grouped[log.source_ip].countryCounts[countryKey] ?? 0) + 1;
  });

  const rows: ThreatRow[] = Object.entries(grouped)
    .map(([ip, data]) => {
      const requests = data.logs.length;
      const totalScore = data.logs.reduce((sum, log) => sum + log.risk_score, 0);
      const maxLog = data.logs.reduce((worst, current) =>
        current.risk_score > worst.risk_score ? current : worst,
      );
      const latestLog = data.logs.reduce((latest, current) =>
        timestampValue(current.timestamp) > timestampValue(latest.timestamp)
          ? current
          : latest,
      );
      const emailAlerts = data.logs.filter((log) => log.email_sent === 1).length;

      const [country = "Unknown"] = Object.entries(data.countryCounts).sort(
        (a, b) => b[1] - a[1],
      )[0] ?? ["Unknown"];

      return {
        ip,
        country,
        requests,
        maxScore: maxLog.risk_score,
        avgScore: requests > 0 ? totalScore / requests : 0,
        lastSeen: latestLog.timestamp,
        latestClassification: latestLog.classification,
        worstClassification: maxLog.classification,
        emailAlerts,
        latitude: latestLog.latitude,
        longitude: latestLog.longitude,
      };
    })
    .sort((a, b) => b.maxScore - a.maxScore);

  const closePopup = () => {
    setActivePopup(null);
  };

  const openPopup = (event: ReactMouseEvent<HTMLButtonElement>, row: ThreatRow) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = Math.min(320, window.innerWidth - 24);
    const popupHeight = 312;
    const margin = 12;

    const centeredLeft = rect.left + rect.width / 2;
    const minLeft = margin + popupWidth / 2;
    const maxLeft = window.innerWidth - margin - popupWidth / 2;
    const left = Math.max(minLeft, Math.min(maxLeft, centeredLeft));

    const showAbove = rect.bottom + popupHeight > window.innerHeight - margin;
    const top = showAbove
      ? Math.max(margin, rect.top - popupHeight - 8)
      : rect.bottom + 8;

    setActivePopup({
      left,
      top,
      row,
    });
  };

  useEffect(() => {
    if (!activePopup) {
      return;
    }

    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (target && popupRef.current?.contains(target)) {
        return;
      }

      closePopup();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopup();
      }
    };

    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activePopup]);

  return (
    <div className="panel-section">
      <div className="panel-title">TOP THREAT ACTORS</div>

      <div className="table-shell threats-table-shell">
        <table className="soc-table threats-table">
          <thead>
            <tr>
              <th>Source IP</th>
              <th>Country</th>
              <th className="threat-col-requests">Total Requests</th>
              <th className="threat-col-score">Max Risk Score</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4}>No threat data yet.</td>
              </tr>
            )}

            {rows.map((row) => {
              const severity = severityClass(row.maxScore);

              return (
                <tr key={row.ip}>
                  <td>
                    <button
                      className="source-ip-trigger threat-ip"
                      type="button"
                      onClick={(event) => openPopup(event, row)}
                      aria-label={`View details for source IP ${row.ip}`}
                    >
                      {maskIp(row.ip)}
                    </button>
                  </td>
                  <td>{row.country}</td>
                  <td className="threat-col-requests">
                    {row.requests.toLocaleString("en-US")}
                  </td>
                  <td className={`threat-score-num threat-col-score ${severity}`}>
                    {Math.round(row.maxScore)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activePopup && (
        <div
          className="ip-info-popover"
          ref={popupRef}
          style={{
            left: `${activePopup.left}px`,
            top: `${activePopup.top}px`,
          }}
          role="dialog"
          aria-modal="false"
          aria-label="Source IP details"
        >
          <div className="ip-info-popover-header">
            <span className="ip-info-popover-title">Source IP Details</span>
            <button
              type="button"
              className="ip-info-popover-close"
              onClick={closePopup}
              aria-label="Close IP details popup"
            >
              x
            </button>
          </div>

          <dl className="ip-info-list">
            <div className="ip-info-item">
              <dt>Source IP</dt>
              <dd>{activePopup.row.ip}</dd>
            </div>
            <div className="ip-info-item">
              <dt>Last Seen</dt>
              <dd>{formatTimestampDetails(activePopup.row.lastSeen)}</dd>
            </div>
            <div className="ip-info-item">
              <dt>Primary Country</dt>
              <dd>{activePopup.row.country}</dd>
            </div>
            <div className="ip-info-item">
              <dt>Total Requests</dt>
              <dd>{activePopup.row.requests.toLocaleString("en-US")}</dd>
            </div>
            <div className="ip-info-item">
              <dt>Max Risk Score</dt>
              <dd>{Math.round(activePopup.row.maxScore)}</dd>
            </div>
            <div className="ip-info-item">
              <dt>Avg Risk Score</dt>
              <dd>{Math.round(activePopup.row.avgScore)}</dd>
            </div>
            <div className="ip-info-item">
              <dt>Worst Classification</dt>
              <dd>{activePopup.row.worstClassification}</dd>
            </div>
            <div className="ip-info-item">
              <dt>Latest Classification</dt>
              <dd>{activePopup.row.latestClassification}</dd>
            </div>
            <div className="ip-info-item">
              <dt>Email Alerts Sent</dt>
              <dd>{activePopup.row.emailAlerts}</dd>
            </div>
            <div className="ip-info-item">
              <dt>Latitude</dt>
              <dd>{formatCoordinate(activePopup.row.latitude)}</dd>
            </div>
            <div className="ip-info-item">
              <dt>Longitude</dt>
              <dd>{formatCoordinate(activePopup.row.longitude)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
