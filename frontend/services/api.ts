import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

export interface Log {
  id?: number;
  timestamp?: string | null;
  source_ip: string;
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
  risk_score: number;
  classification: string;
  email_sent?: number;
}

export interface ManualLogPayload {
  failed_login_count: number;
  login_success_ratio: number;
  privilege_target: number;
  hour_of_day: number;
  is_off_hours: number;
  action_frequency: number;
  connection_rate: number;
  bytes_transferred: number;
  is_new_ip: number;
  source_ip: string;
}

export interface SettingsPayload {
  admin_email: string;
  alert_threshold: number;
}

export interface SimulatorStatus {
  running: boolean;
}

export const getLogs = async () => {
  const res = await API.get<Log[]>("/logs");
  return res.data;
};

export const sendManualLog = async (data: ManualLogPayload) => {
  await API.post("/manual-log", data);
};

export const getSettings = async () => {
  const res = await API.get<SettingsPayload>("/settings");
  return res.data;
};

export const updateSettings = async (data: SettingsPayload) => {
  await API.put("/settings", data);
};

export const getSimulatorStatus = async () => {
  const res = await API.get<SimulatorStatus>("/simulator/status");
  return res.data;
};

export const startSimulator = async () => {
  const res = await API.post<{
    status: string;
    running: boolean;
    message?: string;
  }>("/simulator/start");

  return res.data;
};

export const stopSimulator = async () => {
  const res = await API.post<{
    status: string;
    running: boolean;
    message?: string;
  }>("/simulator/stop");

  return res.data;
};
