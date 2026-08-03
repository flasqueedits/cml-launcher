import React from "react";

export function ProgressBar({ fraction, message, visible }: {
  fraction: number;
  message: string;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div className="glass-card absolute bottom-0 left-0 right-0 z-30 rounded-t-2xl px-5 py-3">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-text-dim">{message}</span>
        <span className="font-mono text-accent-bright">{(fraction * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-dim to-accent transition-all duration-200"
          style={{ width: `${Math.max(0, Math.min(100, fraction * 100))}%` }}
        />
      </div>
    </div>
  );
}
