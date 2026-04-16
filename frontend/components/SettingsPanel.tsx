"use client";

import { useEffect, useState } from "react";

import { getSettings, updateSettings } from "../services/api";

export default function SettingsPanel() {
  const [email, setEmail] = useState("");

  const [threshold, setThreshold] = useState(75);

  useEffect(() => {
    async function load() {
      const data = await getSettings();

      setEmail(data.admin_email);

      setThreshold(Number(data.alert_threshold));
    }

    load();
  }, []);

  async function save() {
    await updateSettings({
      admin_email: email,

      alert_threshold: threshold,
    });

    alert("saved");
  }

  return (
    <div className="panel-section">
      <div className="panel-title">SETTINGS</div>

      <label className="soc-label" htmlFor="settings-email">
        Alert Email
      </label>
      <input
        id="settings-email"
        className="soc-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="soc-label" htmlFor="settings-threshold">
        Risk Threshold
      </label>

      <input
        id="settings-threshold"
        type="range"
        className="soc-input"
        value={threshold}
        min="0"
        max="100"
        onChange={(e) => setThreshold(Number(e.target.value))}
      />
      <p>Threshold: {threshold}</p>

      <button onClick={save} className="soc-button">
        Save
      </button>
    </div>
  );
}
