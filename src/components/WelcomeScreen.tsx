interface WelcomeScreenProps {
  onOpenFile: () => void
  error: string | null
}

export function WelcomeScreen({ onOpenFile, error }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <svg
        className="welcome-icon"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="8"
          y="16"
          width="64"
          height="48"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <line
          x1="8"
          y1="28"
          x2="72"
          y2="28"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="16" cy="22" r="2" fill="currentColor" />
        <circle cx="24" cy="22" r="2" fill="currentColor" />
        <circle cx="32" cy="22" r="2" fill="currentColor" />
        <rect
          x="14"
          y="34"
          width="52"
          height="3"
          rx="1.5"
          fill="currentColor"
          opacity="0.3"
        />
        <rect
          x="14"
          y="41"
          width="40"
          height="3"
          rx="1.5"
          fill="currentColor"
          opacity="0.2"
        />
        <rect
          x="14"
          y="48"
          width="46"
          height="3"
          rx="1.5"
          fill="currentColor"
          opacity="0.15"
        />
        <rect
          x="14"
          y="55"
          width="32"
          height="3"
          rx="1.5"
          fill="currentColor"
          opacity="0.1"
        />
      </svg>
      <h1 className="welcome-title">Netscope</h1>
      <p className="welcome-subtitle">
        Open, inspect, and analyze HTTP Archive files.
        <br />
        Drop a <code>.har</code> file here, or open one from the menu.
      </p>
      <div className="welcome-actions">
        <button className="welcome-open-btn" onClick={onOpenFile}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 12.5V3.5C2 2.67 2.67 2 3.5 2H6.5L8 4H12.5C13.33 4 14 4.67 14 5.5V12.5C14 13.33 13.33 14 12.5 14H3.5C2.67 14 2 13.33 2 12.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Open HAR File
        </button>
        <p className="welcome-hint">
          or press <span className="welcome-kbd">Cmd+O</span> to open
        </p>
      </div>
      {error && <div className="welcome-error">{error}</div>}
    </div>
  )
}
