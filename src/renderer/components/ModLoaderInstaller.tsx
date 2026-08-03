import React from "react";
import type { ModLoaderInfo } from "../../shared/types";

interface Props {
  loaders: ModLoaderInfo[];
  onInstall: (loader: ModLoaderInfo) => void;
  mcVersion: string;
  onMcVersionChange: (v: string) => void;
  installing: string | null;
}

export function ModLoaderInstaller({ loaders, onInstall, mcVersion, onMcVersionChange, installing }: Props) {
  const [filter, setFilter] = React.useState<"all" | "forge" | "fabric" | "quilt" | "neoforge">("all");
  const filtered = filter === "all" ? loaders : loaders.filter((l) => l.type === filter);

  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Mod Loader Kur</h2>
      </div>
      <div className="mb-3 flex gap-2">
        <input className="input-field flex-1" placeholder="MC sürümü (ör: 1.20.1)" value={mcVersion} onChange={(e) => onMcVersionChange(e.target.value)} />
      </div>
      <div className="mb-3 flex gap-1">
        {(["all", "forge", "fabric", "quilt", "neoforge"] as const).map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase transition-colors ${filter === t ? "bg-accent text-bg" : "bg-surface-2 text-text-dim hover:text-text"}`}>{t === "all" ? "Tümü" : t}</button>
        ))}
      </div>
      <div className="max-h-[300px] space-y-2 overflow-y-auto">
        {filtered.length === 0 && <div className="py-6 text-center text-sm text-text-dim">Mod loader bulunamadı.</div>}
        {filtered.map((l, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold ${l.type === "forge" ? "bg-orange-900/40 text-orange-400" : l.type === "fabric" ? "bg-purple-900/40 text-purple-400" : l.type === "quilt" ? "bg-pink-900/40 text-pink-400" : "bg-blue-900/40 text-blue-400"}`}>
              {l.type === "forge" ? "F" : l.type === "fabric" ? "Fb" : l.type === "quilt" ? "Q" : "NF"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-text">{l.name} <span className="text-text-dim">v{l.version}</span></div>
              <div className="text-[10px] text-text-dim">MC {l.mcVersion}</div>
            </div>
            <button onClick={() => onInstall(l)} disabled={!!installing} className="play-button !h-8 rounded-lg px-3 text-[10px] font-semibold text-white disabled:opacity-50">
              {installing === l.name ? "Kuruluyor..." : "Kur"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
