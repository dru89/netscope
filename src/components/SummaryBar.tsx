import type { SummaryStats } from '../types/har'
import { formatBytes, formatTime } from '../utils/har'

interface SummaryBarProps {
  summary: SummaryStats
}

export function SummaryBar({ summary }: SummaryBarProps) {
  return (
    <div className="summary-bar">
      <div className="summary-item">
        <span className="summary-value">{summary.totalRequests}</span>
        <span>requests</span>
      </div>
      <div className="summary-separator" />
      <div className="summary-item">
        <span className="summary-value">
          {formatBytes(summary.totalTransferSize)}
        </span>
        <span>transferred</span>
      </div>
      <div className="summary-separator" />
      <div className="summary-item">
        <span className="summary-value">
          {formatBytes(summary.totalUncompressedSize)}
        </span>
        <span>resources</span>
      </div>
      <div className="summary-separator" />
      <div className="summary-item">
        <span className="summary-value">
          {formatTime(summary.totalTime)}
        </span>
        <span>total</span>
      </div>
      <div className="summary-separator" />
      {Object.entries(summary.requestsByType)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => (
          <div className="summary-item" key={type}>
            <span className="summary-value">{count}</span>
            <span>{type}</span>
          </div>
        ))}
    </div>
  )
}
