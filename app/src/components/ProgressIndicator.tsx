/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

export function ProgressIndicator({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="progress-indicator" aria-label={`${label}: ${detail}`}>
      <div className="data-bar-row">
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <div className="data-bar-track" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
