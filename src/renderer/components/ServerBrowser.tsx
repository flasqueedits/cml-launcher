import React from "react";
import type { PopularServer } from "../../shared/types";

interface Props {
  servers: PopularServer[];
  onRefresh: () => void;
  onAdd: (address: string, port: number, name: string) => void;
}

export function ServerBrowser({ servers, onRefresh, onAdd }: Props) {
  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Popüler Sunucular</h2>
        <button onClick={onRefresh} className="icon-button !h-6 !w-6" title="Yenile"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg></button>
      </div>
      <div className="max-h-[380px] space-y-2 overflow-y-auto">
        {servers.length === 0 && <div className="py-8 text-center text-sm text-text-dim">Sunucular yükleniyor...</div>}
        {servers.map((s) => (
          <div key={s.address} className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-3 transition-colors hover:border-accent">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-accent">{s.name[0]}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{s.name}</div>
              <div className="text-[10px] text-text-dim">{s.address}:{s.port} {s.ping ? `• ${s.ping}ms` : ""}</div>
              <div className="mt-0.5 flex gap-1">
                {s.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] text-text-dim">{t}</span>
                ))}
              </div>
            </div>
            <button onClick={() => onAdd(s.address, s.port, s.name)} className="icon-button !h-7 !w-7" title="Listeye ekle">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
