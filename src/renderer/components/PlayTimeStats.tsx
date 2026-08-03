import React from "react";
import type { PlayTimeRecord } from "../../shared/types";

interface Props {
  records: PlayTimeRecord[];
}

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}sa ${m}dk`;
  return `${m}dk`;
}

export function PlayTimeStats({ records }: Props) {
  const totalMs = records.reduce((sum, r) => sum + r.totalMs, 0);
  const sorted = [...records].sort((a, b) => b.totalMs - a.totalMs);

  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <h2 className="mb-4 text-base font-semibold">Oyun Süresi</h2>
      <div className="mb-4 rounded-xl border border-accent/30 bg-accent-dim/20 p-4 text-center">
        <div className="text-2xl font-bold text-accent">{formatMs(totalMs)}</div>
        <div className="text-xs text-text-dim">Toplam oyun süresi</div>
      </div>
      <div className="max-h-[300px] space-y-2 overflow-y-auto">
        {sorted.length === 0 && <div className="py-6 text-center text-sm text-text-dim">Henüz oyun süresi yok.</div>}
        {sorted.map((r) => (
          <div key={r.versionId} className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-accent">
              {r.versionId.slice(0, 4)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{r.versionId}</div>
              <div className="text-[10px] text-text-dim">{r.sessions.length} oturum</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-accent">{formatMs(r.totalMs)}</div>
              <div className="text-[10px] text-text-dim">{r.lastPlayed ? new Date(r.lastPlayed).toLocaleDateString("tr-TR") : ""}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
