import React from "react";
import type { ServerInfo } from "../../shared/types";

interface Props {
  servers: ServerInfo[];
  onAdd: (address: string, port: number, name: string) => void;
  onRemove: (id: string) => void;
  onPing: (address: string, port: number) => void;
  onConnect: (address: string, port: number) => void;
  busy: boolean;
}

export function ServerListPanel({ servers, onAdd, onRemove, onPing, onConnect, busy }: Props) {
  const [address, setAddress] = React.useState("");
  const [port, setPort] = React.useState("25565");
  const [name, setName] = React.useState("");

  const handleAdd = () => {
    const addr = address.trim();
    const p = parseInt(port) || 25565;
    const n = name.trim() || addr;
    if (!addr) return;
    onAdd(addr, p, n);
    setAddress("");
    setPort("25565");
    setName("");
  };

  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Sunucu Listesi</h2>
        <span className="text-xs text-text-dim">{servers.length} sunucu</span>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="Sunucu adresi (ör: mc.hypixel.net)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <input
          className="input-field w-20"
          placeholder="Port"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <input
          className="input-field w-28"
          placeholder="İsim"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="play-button shrink-0 rounded-lg px-3 text-xs font-semibold text-white"
        >
          Ekle
        </button>
      </div>

      <div className="max-h-[320px] space-y-2 overflow-y-auto">
        {servers.length === 0 && (
          <div className="py-8 text-center text-sm text-text-dim">
            Henüz sunucu eklenmedi. Yukarıdaki alana adres girin.
          </div>
        )}
        {servers.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-3 transition-colors hover:border-accent"
          >
            <div className={`h-2.5 w-2.5 rounded-full ${s.online ? "bg-green-400" : "bg-red-400"}`} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{s.name}</div>
              <div className="text-[10px] text-text-dim">
                {s.address}:{s.port}
                {s.ping != null && ` — ${s.ping}ms`}
                {s.players && ` — ${s.players.online}/${s.players.max} oyuncu`}
              </div>
              {s.description && (
                <div className="mt-0.5 truncate text-[10px] text-text-dim/60">{s.description}</div>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onPing(s.address, s.port)}
                disabled={busy}
                className="icon-button !h-7 !w-7"
                title="Ping"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
              <button
                onClick={() => onConnect(s.address, s.port)}
                disabled={busy || !s.online}
                className="play-button !h-7 !w-7 rounded-lg"
                title="Bağlan"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>
              <button
                onClick={() => onRemove(s.id)}
                disabled={busy}
                className="icon-button !h-7 !w-7 hover:!border-danger hover:!text-danger"
                title="Sil"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
