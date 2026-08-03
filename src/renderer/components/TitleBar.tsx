import React from "react";

export function TitleBar() {
  return (
    <div className="drag-region relative z-20 flex h-9 items-center justify-between bg-transparent px-3">
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" opacity="0.8" />
          <path d="M7 7h0v0z" />
        </svg>
        <span className="text-sm font-semibold text-text">CML Launcher</span>
      </div>
      <div className="no-drag flex gap-0.5">
        <button
          onClick={() => window.api.windowMinimize()}
          className="flex h-7 w-8 items-center justify-center rounded text-text-dim hover:bg-surface-2 hover:text-text"
          title="Küçült"
        >
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
            <rect x="1" y="5.5" width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={() => window.api.windowMaximize()}
          className="flex h-7 w-8 items-center justify-center rounded text-text-dim hover:bg-surface-2 hover:text-text"
          title="Büyüt"
        >
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="1.5" y="1.5" width="9" height="9" rx="1" />
          </svg>
        </button>
        <button
          onClick={() => window.api.windowClose()}
          className="flex h-7 w-8 items-center justify-center rounded text-text-dim hover:bg-danger hover:text-white"
          title="Kapat"
        >
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="2" x2="10" y2="10" />
            <line x1="10" y1="2" x2="2" y2="10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
