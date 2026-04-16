import { Log } from "../services/api";

interface Props {
  logs: Log[];
}

function maskIp(ip: string) {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return ip;
  }

  return `${parts[0]}.${parts[1]}.x.x`;
}

function formatUtcTimestamp(timestamp?: string | null) {
  if (!timestamp) {
    return "--:--:-- UTC";
  }

  const raw = timestamp.replace("T", " ").split(".")[0];
  const segments = raw.split(" ");
  const time = segments[1];

  return time ? `${time} UTC` : "--:--:-- UTC";
}

function classificationClass(classification: string) {
  if (classification === "Malicious") {
    return "threat-high";
  }

  if (classification === "Suspicious") {
    return "threat-medium";
  }

  return "threat-low";
}

function actionTaken(log: Log) {
  if (log.email_sent === 1) {
    return {
      text: "EMAIL SENT (Admin)",
      className: "threat-high",
    };
  }

  if (
    log.classification === "Suspicious" ||
    log.classification === "Malicious"
  ) {
    return {
      text: "FLAGGED",
      className: "threat-medium",
    };
  }

  return {
    text: "ALLOWED",
    className: "threat-low",
  };
}

export default function LiveLogStream({ logs }: Props) {
  return (
    <div className="panel-section">
      <div className="panel-title">LIVE EVENT STREAM</div>

      <div className="table-shell stream-shell">
        <table className="soc-table stream-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Source IP</th>
              <th>Threat Classification</th>
              <th>Dynamic Risk Score</th>
              <th>Action Taken</th>
            </tr>
          </thead>

          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={5}>No live logs yet.</td>
              </tr>
            )}

            {logs.map((log) => {
              const rowClass = classificationClass(log.classification);
              const action = actionTaken(log);

              return (
                <tr key={log.id}>
                  <td className={rowClass}>
                    {formatUtcTimestamp(log.timestamp)} | {log.classification}{" "}
                    Logs
                  </td>
                  <td className={rowClass}>{maskIp(log.source_ip)}</td>
                  <td className={rowClass}>
                    {log.classification.toUpperCase()}
                  </td>
                  <td className={rowClass}>{Math.round(log.risk_score)}</td>
                  <td className={action.className}>{action.text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
