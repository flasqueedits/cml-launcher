import React from "react";
import type { MinecraftRelease } from "../../shared/types";

interface Props {
  versions: MinecraftRelease[];
  lastPlayed: string;
  onSelect: (versionId: string) => void;
  onPlay: () => void;
  busy: boolean;
  running: boolean;
}

export function QuickPlay({ versions, lastPlayed, onSelect, onPlay, busy, running }: Props) {
  const recent = React.useMemo(() => {
    const sorted = [...versions].sort((a, b) => {
      if (a.id === lastPlayed) return -1;
      if (b.id === lastPlayed) return 1;
      return b.releaseTime.localeCompare(a.releaseTime);
    });
    return sorted.slice(0, 6);
  }, [versions, lastPlayed]);

  return (
    <div className="glass-card relative z-10 w-[420px] rounded-2xl p-5">
      <h2 className="mb-4 text-base font-semibold">Hızlı Başlat</h2>

      {lastPlayed && (
        <div className="mb-4 rounded-xl border border-accent/30 bg-accent-dim/10 p-4 text-center">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-text-dim">Son Oynanan</div>
          <div className="mb-2 text-lg font-bold text-accent">{lastPlayed}</div>
          <button onClick={() => { onSelect(lastPlayed); onPlay(); }} disabled={busy || running} className="play-button rounded-xl px-6 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {running ? "Oyunda..." : busy ? "Hazırlanıyor..." : "Hemen Oyna"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-text-dim">Son Kullanılan Sürümler</div>
        {recent.map((v) => (
          <div key={v.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-colors cursor-pointer ${v.id === lastPlayed ? "border-accent/40 bg-accent-dim/10 hover:border-accent" : "border-border bg-surface/50 hover:border-accent/50"}`} onClick={() => onSelect(v.id)}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold ${v.type === "release" ? "bg-green-900/40 text-green-400" : v.type === "snapshot" ? "bg-purple-900/40 text-purple-400" : "bg-surface-2 text-text-dim"}`}>
              {v.type === "release" ? "R" : v.type === "snapshot" ? "S" : "O"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{v.id}</div>
              <div className="text-[10px] text-text-dim">{new Date(v.releaseTime).toLocaleDateString("tr-TR")}</div>
            </div>
            {v.id === lastPlayed && <span className="text-[10px] text-accent">Son</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
