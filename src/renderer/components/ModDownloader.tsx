import React from "react";
import type { OnlineMod } from "../../shared/types";

interface Props {
  mods: OnlineMod[];
  onSearch: (query: string, source: "curseforge" | "modrinth") => void;
  onInstall: (mod: OnlineMod) => void;
  installing: string | null;
}

function formatDownloads(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function ModDownloader({ mods, onSearch, onInstall, installing }: Props) {
  const [query, setQuery] = React.useState("");
  const [source, setSource] = React.useState<"curseforge" | "modrinth">("modrinth");

  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <h2 className="mb-4 text-base font-semibold">Mod İndirici</h2>
      <div className="mb-3 flex gap-2">
        <input className="input-field flex-1" placeholder="Mod ara..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSearch(query, source)} />
        <button onClick={() => onSearch(query, source)} className="play-button shrink-0 rounded-lg px-3 text-xs font-semibold text-white">Ara</button>
      </div>
      <div className="mb-3 flex gap-1">
        <button onClick={() => setSource("modrinth")} className={`rounded-lg px-3 py-1 text-[10px] font-semibold ${source === "modrinth" ? "bg-green-600 text-white" : "bg-surface-2 text-text-dim"}`}>Modrinth</button>
        <button onClick={() => setSource("curseforge")} className={`rounded-lg px-3 py-1 text-[10px] font-semibold ${source === "curseforge" ? "bg-orange-600 text-white" : "bg-surface-2 text-text-dim"}`}>CurseForge</button>
      </div>
      <div className="max-h-[300px] space-y-2 overflow-y-auto">
        {mods.length === 0 && <div className="py-6 text-center text-sm text-text-dim">Mod arayın.</div>}
        {mods.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-3">
            {m.iconUrl ? <img src={m.iconUrl} className="h-10 w-10 rounded-lg object-cover" alt="" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-xs text-text-dim">?</div>}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{m.name}</div>
              <div className="truncate text-[10px] text-text-dim">{m.author} • {formatDownloads(m.downloads)} indirme</div>
              <div className="truncate text-[10px] text-text-dim/60">{m.description}</div>
            </div>
            <button onClick={() => onInstall(m)} disabled={!!installing || !m.installable} className="play-button !h-8 rounded-lg px-3 text-[10px] font-semibold text-white disabled:opacity-50">
              {installing === m.id ? "..." : "Kur"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
