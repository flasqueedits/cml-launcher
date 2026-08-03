import React from "react";
import type { WorldInfo } from "../../shared/types";

interface Props {
  worlds: WorldInfo[];
  onRemove: (folderName: string) => void;
  onBackup: (folderName: string) => void;
  onRefresh: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WorldManager({ worlds, onRemove, onBackup, onRefresh }: Props) {
  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Dünyalar</h2>
        <div className="flex gap-2">
          <span className="text-xs text-text-dim">{worlds.length} dünya</span>
          <button onClick={onRefresh} className="icon-button !h-6 !w-6" title="Yenile">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
          </button>
        </div>
      </div>
      <div className="max-h-[380px] space-y-2 overflow-y-auto">
        {worlds.length === 0 && <div className="py-8 text-center text-sm text-text-dim">Dünya bulunamadı.</div>}
        {worlds.map((w) => (
          <div key={w.folderName} className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-3 transition-colors hover:border-accent">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-900/40">
              <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{w.name}</div>
              <div className="text-[10px] text-text-dim">{formatSize(w.size)} • {w.version}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onBackup(w.folderName)} className="icon-button !h-7 !w-7" title="Yedekle">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              </button>
              <button onClick={() => onRemove(w.folderName)} className="icon-button !h-7 !w-7 hover:!border-danger hover:!text-danger" title="Sil">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
