"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import Header from "../components/Header";
import KpiGrid from "../components/kpiGrid";
import LiveLogStream from "../components/LiveLogStream";
import ManualLogPanel from "../components/ManualLogPanel";
import SettingsPanel from "../components/SettingsPanel";
import TopThreats from "../components/TopThreats";
import {
  getLogs,
  getSimulatorStatus,
  Log,
  startSimulator,
  stopSimulator,
} from "../services/api";

const ThreatMap = dynamic(() => import("../components/ThreatMap"), {
  ssr: false,
});

type ModalType = "manual" | "email" | null;

export default function Page() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [simulatorBusy, setSimulatorBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveModal("email");
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadLogs = async () => {
      const data = await getLogs();

      if (isActive) {
        setLogs(data);
      }
    };

    const initialTimer = setTimeout(() => {
      void loadLogs();
    }, 0);

    const intervalTimer = setInterval(() => {
      void loadLogs();
    }, 3000);

    return () => {
      isActive = false;
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadSimulatorStatus = async () => {
      try {
        const data = await getSimulatorStatus();

        if (isActive) {
          setSimulatorRunning(data.running);
        }
      } catch {
        if (isActive) {
          setSimulatorRunning(false);
        }
      }
    };

    const initialTimer = setTimeout(() => {
      void loadSimulatorStatus();
    }, 0);

    const intervalTimer = setInterval(() => {
      void loadSimulatorStatus();
    }, 5000);

    return () => {
      isActive = false;
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  useEffect(() => {
    if (!activeModal) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveModal(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeModal]);

  const handleToggleSimulator = async () => {
    if (simulatorBusy) {
      return;
    }

    setSimulatorBusy(true);

    try {
      const data = simulatorRunning ? await stopSimulator() : await startSimulator();
      setSimulatorRunning(data.running);
    } catch {
      // Keep existing state if request fails.
    } finally {
      setSimulatorBusy(false);
    }
  };

  return (
    <main className="soc-page">
      <div className="soc-layout">
        <section className="soc-row">
          <Header
            onOpenManualTest={() => setActiveModal("manual")}
            onToggleSimulator={handleToggleSimulator}
            onOpenEmailSettings={() => setActiveModal("email")}
            simulatorRunning={simulatorRunning}
            simulatorBusy={simulatorBusy}
          />
        </section>

        <section className="soc-row">
          <KpiGrid logs={logs} />
        </section>

        <section className="soc-row soc-split-row">
          <div className="soc-cell">
            <ThreatMap logs={logs} />
          </div>
          <div className="soc-cell">
            <TopThreats logs={logs} />
          </div>
        </section>

        <section className="soc-row">
          <LiveLogStream logs={logs} />
        </section>
      </div>

      {activeModal && (
        <div
          className="soc-modal-backdrop"
          onClick={() => setActiveModal(null)}
          role="presentation"
        >
          <div
            className="soc-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="soc-modal-close"
              type="button"
              onClick={() => setActiveModal(null)}
              aria-label="Close popup"
            >
              x
            </button>

            {activeModal === "manual" ? <ManualLogPanel /> : <SettingsPanel />}
          </div>
        </div>
      )}
    </main>
  );
}
