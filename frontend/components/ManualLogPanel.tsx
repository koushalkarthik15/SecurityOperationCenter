"use client";

import { useState } from "react";

import { ManualLogPayload, sendManualLog } from "../services/api";

interface ManualLogFormInput {
  failed_logins: number;
  login_attempts: number;
  session_duration: number;
  network_packet_size: number;
  ip_reputation_score: number;
  unusual_time_access: number;
  source_ip: string;
}

function toFeaturePayload(form: ManualLogFormInput): ManualLogPayload {
  const failedLogins = Number(form.failed_logins) || 0;
  const loginAttempts = Number(form.login_attempts) || 0;
  const sessionDuration = Number(form.session_duration) || 0;
  const networkPacketSize = Number(form.network_packet_size) || 0;
  const ipReputationScore = Number(form.ip_reputation_score) || 0;
  const unusualTimeAccess = Number(form.unusual_time_access) || 0;

  return {
    failed_login_count: failedLogins,
    login_success_ratio: (loginAttempts - failedLogins) / (loginAttempts + 1),
    privilege_target: Number(ipReputationScore < 0.3),
    hour_of_day: new Date().getHours(),
    is_off_hours: unusualTimeAccess,
    action_frequency: 1 / (sessionDuration + 1),
    connection_rate: networkPacketSize / (sessionDuration + 1),
    bytes_transferred: networkPacketSize,
    is_new_ip: Number(ipReputationScore < 0.2),
    source_ip: form.source_ip,
  };
}

export default function ManualLogPanel() {
  const [form, setForm] = useState<ManualLogFormInput>({
    failed_logins: 5,
    login_attempts: 12,
    session_duration: 900,
    network_packet_size: 500,
    ip_reputation_score: 0.42,
    unusual_time_access: 1,
    source_ip: "142.250.183.14",
  });

  function update<K extends keyof ManualLogFormInput>(
    key: K,
    val: ManualLogFormInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: val,
    }));
  }

  async function send() {
    const payload = toFeaturePayload(form);
    await sendManualLog(payload);
    alert("log sent");
  }

  return (
    <div className="panel-section">
      <div className="panel-title">MANUAL TEST</div>

      <label className="soc-label" htmlFor="manual-source-ip">
        Source IP
      </label>
      <input
        id="manual-source-ip"
        className="soc-input"
        value={form.source_ip}
        onChange={(e) => update("source_ip", e.target.value)}
      />

      <label className="soc-label" htmlFor="manual-failed-logins">
        Failed Logins
      </label>
      <input
        id="manual-failed-logins"
        type="text"
        className="soc-input"
        value={form.failed_logins}
        onChange={(e) => update("failed_logins", Number(e.target.value))}
      />

      <label className="soc-label" htmlFor="manual-login-attempts">
        Login Attempts
      </label>
      <input
        id="manual-login-attempts"
        type="text"
        className="soc-input"
        value={form.login_attempts}
        onChange={(e) => update("login_attempts", Number(e.target.value))}
      />

      <label className="soc-label" htmlFor="manual-session-duration">
        Session Duration
      </label>
      <input
        id="manual-session-duration"
        type="text"
        className="soc-input"
        value={form.session_duration}
        onChange={(e) => update("session_duration", Number(e.target.value))}
      />

      <label className="soc-label" htmlFor="manual-network-packet-size">
        Network Packet Size
      </label>
      <input
        id="manual-network-packet-size"
        type="text"
        className="soc-input"
        value={form.network_packet_size}
        onChange={(e) => update("network_packet_size", Number(e.target.value))}
      />

      <label className="soc-label" htmlFor="manual-ip-reputation-score">
        IP Reputation Score
      </label>
      <input
        id="manual-ip-reputation-score"
        type="text"
        className="soc-input"
        value={form.ip_reputation_score}
        onChange={(e) => update("ip_reputation_score", Number(e.target.value))}
      />

      <label className="soc-label" htmlFor="manual-unusual-time-access">
        Unusual Time Access
      </label>
      <input
        id="manual-unusual-time-access"
        type="text"
        className="soc-input"
        value={form.unusual_time_access}
        onChange={(e) => update("unusual_time_access", Number(e.target.value))}
      />

      <button onClick={send} className="soc-button">
        Send Test Log
      </button>
    </div>
  );
}
