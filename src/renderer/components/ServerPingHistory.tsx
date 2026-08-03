import React from "react";
import type { ServerInfo } from "../../shared/types";

interface PingRecord {
  timestamp: number;
  ping: number;
  online: boolean;
}

export function ServerPingHistory({ servers, onRefresh, onPing }: { servers: ServerInfo[]; onRefresh: () => void; onPing: (address: string, port: number) => Promise<ServerInfo> }) {
  const [selectedServer, setSelectedServer] = React.useState<string>("");
  const [history, setHistory] = React.useState<PingRecord[]>([]);
  const [pinging, setPinging] = React.useState(false);

  React.useEffect(() => {
    if (servers.length > 0 && !selectedServer) {
      setSelectedServer(`${servers[0].address}:${servers[0].port}`);
    }
  }, [servers, selectedServer]);

  const current = servers.find((s) => `${s.address}:${s.port}` === selectedServer);

  const addPingRecord = async () => {
    if (!current) return;
    setPinging(true);
    try {
      const result = await onPing(current.address, current.port);
      setHistory((prev) => [...prev.slice(-29), {
        timestamp: Date.now(),
        ping: result.ping ?? 0,
        online: result.online ?? false,
      }]);
    } catch { }
    setPinging(false);
  };

  React.useEffect(() => {
    if (current && history.length === 0) addPingRecord();
  }, [selectedServer]);

  const maxPing = Math.max(...history.map((h) => h.ping), 1);
  const avgPing = history.length ? Math.round(history.reduce((s, h) => s + h.ping, 0) / history.length) : 0;
  const onlineCount = history.filter((h) => h.online).length;

  return (
    <div className="glass-card flex h-full flex-col rounded-xl border border-border/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-accent">Sunucu Ping Geçmişi</h2>
        <button onClick={addPingRecord} disabled={pinging || !current} className="glass-button rounded-lg px-3 py-1.5 text-xs text-white/70 hover:text-accent disabled:opacity-50">
          {pinging ? "Ping atılıyor..." : "Ping At"}
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <select
          value={selectedServer}
          onChange={(e) => { setSelectedServer(e.target.value); setHistory([]); }}
          className="flex-1 rounded-lg border border-border/30 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-accent/50"
        >
          {servers.map((s) => (
            <option key={`${s.address}:${s.port}`} value={`${s.address}:${s.port}`}>
              {s.name || s.address}:{s.port}
            </option>
          ))}
        </select>
        <button onClick={onRefresh} className="glass-button rounded-lg p-1.5 text-white/50 hover:text-accent">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
        </button>
      </div>

      {current && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border/20 bg-white/5 p-2 text-center">
            <div className="text-lg font-bold text-white">{current.ping ?? "-"}</div>
            <div className="text-[10px] text-white/40">Anlık Ping (ms)</div>
          </div>
          <div className="rounded-lg border border-border/20 bg-white/5 p-2 text-center">
            <div className="text-lg font-bold text-blue-400">{avgPing}</div>
            <div className="text-[10px] text-white/40">Ortalama</div>
          </div>
          <div className="rounded-lg border border-border/20 bg-white/5 p-2 text-center">
            <div className="text-lg font-bold text-green-400">{onlineCount}/{history.length}</div>
            <div className="text-[10px] text-white/40">Çevrimiçi</div>
          </div>
        </div>
      )}

      <div className="flex-1 rounded-lg border border-border/20 bg-black/30 p-2">
        {history.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-white/20">Henüz ping kaydı yok</div>
        ) : (
          <div className="flex h-full items-end gap-px">
            {history.map((h, i) => (
              <div key={i} className="group relative flex-1" style={{ height: `${(h.ping / maxPing) * 100}%` }}>
                <div className={`h-full w-full rounded-t-sm ${h.online ? "bg-accent/70" : "bg-red-500/70"}`} />
                <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                  {h.ping}ms • {new Date(h.timestamp).toLocaleTimeString("tr-TR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-white/30">
        <span>{history.length} kayıt</span>
        <span>Son 30 ping</span>
      </div>
    </div>
  );
}
