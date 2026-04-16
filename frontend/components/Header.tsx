interface HeaderProps {
  onOpenManualTest: () => void;
  onToggleSimulator: () => void;
  onOpenEmailSettings: () => void;
  simulatorRunning: boolean;
  simulatorBusy: boolean;
}

export default function Header({
  onOpenManualTest,
  onToggleSimulator,
  onOpenEmailSettings,
  simulatorRunning,
  simulatorBusy,
}: HeaderProps) {
  return (
    <div className="soc-header">
      <div className="soc-header-title">MINI SOC - AI THREAT INTELLIGENCE</div>

      <div className="soc-header-meta">
        <button className="soc-action-btn" type="button" onClick={onOpenManualTest}>
          <span className="soc-action-indicator soc-manual-indicator" />
          <span className="soc-action-copy">
            <span className="soc-action-label">Manual Test</span>
            <span className="soc-action-value">Open Test Panel</span>
          </span>
        </button>

        <button
          className="soc-action-btn"
          type="button"
          onClick={onToggleSimulator}
          disabled={simulatorBusy}
        >
          <span className="soc-action-indicator soc-sim-indicator" />
          <span className="soc-action-copy">
            <span className="soc-action-label">Simulator</span>
            <span className="soc-action-value">
              {simulatorBusy ? "Working..." : simulatorRunning ? "Stop Feed" : "Start Feed"}
            </span>
          </span>
        </button>

        <button className="soc-action-btn" type="button" onClick={onOpenEmailSettings}>
          <span className="soc-action-indicator soc-email-indicator" />
          <span className="soc-action-copy">
            <span className="soc-action-label">Email</span>
            <span className="soc-action-value">Alert Settings</span>
          </span>
        </button>
      </div>
    </div>
  );
}
