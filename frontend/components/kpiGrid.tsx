import type { CSSProperties } from "react";

import { Log } from "../services/api";

interface Props {
  logs: Log[];
}

function compact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function riskZone(avgRisk: number) {
  if (avgRisk >= 85) {
    return {
      text: "RED ZONE: MALICIOUS",
      className: "risk-zone-high",
    };
  }

  if (avgRisk >= 45) {
    return {
      text: "YELLOW ZONE: SUSPICIOUS",
      className: "risk-zone-mid",
    };
  }

  return {
    text: "GREEN ZONE: NORMAL",
    className: "risk-zone-low",
  };
}

export default function KpiGrid({ logs }: Props) {
  const total = logs.length;
  const malicious = logs.filter((l) => l.classification === "Malicious").length;
  const alerts = logs.filter((l) => l.email_sent === 1).length;
  const avgRaw = logs.length
    ? logs.reduce((sum, row) => sum + row.risk_score, 0) / logs.length
    : 0;
  const avgRisk = Math.max(0, Math.min(100, avgRaw));

  const zone = riskZone(avgRisk);
  const needleRotation = `${avgRisk * 1.8 - 90}deg`;

  return (
    <div className="kpi-grid">
      <Card title="TOTAL EVENTS" value={compact(total)} subtitle="logs processed" />
      <Card
        title="ACTIVE THREATS"
        value={compact(malicious)}
        subtitle="Risk Score > 85"
        emphasis="danger"
      />
      <Card
        title="NOTIFICATIONS SENT"
        value={compact(alerts)}
        subtitle="via Email Alerts"
      />

      <div className="kpi-card kpi-gauge-card">
        <div className="kpi-label">AVG. RISK SCORE</div>

        <div className="risk-meter">
          <div className="risk-meter-arc" />
          <div className="risk-meter-cutout" />
          <div
            className="risk-meter-needle"
            style={{ "--needle-rotation": needleRotation } as CSSProperties}
          />
          <div className="risk-meter-value">{Math.round(avgRisk)}%</div>
        </div>

        <div className={`kpi-subtext ${zone.className}`}>{zone.text}</div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  subtitle,
  emphasis,
}: {
  title: string;
  value: string;
  subtitle: string;
  emphasis?: "danger";
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{title}</div>
      <div className={`kpi-value ${emphasis === "danger" ? "kpi-value-danger" : ""}`}>
        {value}
      </div>
      <div className={`kpi-subtext ${emphasis === "danger" ? "risk-zone-high" : ""}`}>
        {subtitle}
      </div>
    </div>
  );
}
