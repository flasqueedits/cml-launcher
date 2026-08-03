import React from "react";
import type { ServerInfo } from "../../shared/types";

interface Props {
  servers: ServerInfo[];
  onRefresh: () => void;
  onPing: (address: string, port: number) => Promise<ServerInfo>;
}

export function ServerMOTDPanel({ servers, onRefresh, onPing }: Props) {
  const [pinging, setPinging] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<Record<string, ServerInfo>>({});

  const pingServer = async (server: ServerInfo) => {
    setPinging(server.address);
    try {
      const result = await onPing(server.address, server.port);
      setResults((prev) => ({ ...prev, [server.address]: result }));
    } catch {}
    setPinging(null);
  };

  const pingAll = async () => {
    for (const s of servers) {
      await pingServer(s);
    }
  };

  return (
    <div className="glass-card relative z-10 w-[480px] max-h-[500px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">🖥️ Sunucu MOTD</h2>
        <div className="flex gap-2">
          <button onClick={pingAll} className="rounded-lg bg-surface/50 px-3 py-1.5 text-xs text-text-dim hover:text-text">📡 Tümünü Ping</button>
          <button onClick={onRefresh} className="rounded-lg bg-surface/50 px-3 py-1.5 text-xs text-text-dim hover:text-text">🔄</button>
        </div>
      </div>

      <div className="space-y-2">
        {servers.map((server) => {
          const r = results[server.address];
          const ping = r?.ping ?? server.ping;
          const online = r?.online ?? server.online;
          const players = r?.players ?? server.players;
          const isLoading = pinging === server.address;

          const pingColor = !ping ? "text-text-dim" : ping < 50 ? "text-green-400" : ping < 100 ? "text-yellow-400" : "text-red-400";

          return (
            <div key={server.id} className="flex items-center gap-3 rounded-xl border border-border/30 bg-surface/30 p-3">
              {/* Status Dot */}
              <div className={`h-2.5 w-2.5 rounded-full ${online ? "bg-green-400" : "bg-red-400"}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{server.name}</span>
                  {server.version && <span className="rounded bg-surface/50 px-1.5 py-0.5 text-[9px] text-text-dim">{server.version}</span>}
                </div>
                <div className="text-[10px] text-text-dim truncate">{server.address}:{server.port}</div>
                {r?.description && <div className="mt-1 text-[10px] text-text-dim italic truncate">{r.description}</div>}
              </div>

              {/* Players */}
              {players && (
                <div className="text-center">
                  <div className="text-[10px] text-text-dim">Oyuncu</div>
                  <div className="text-xs font-medium">{players.online}/{players.max}</div>
                </div>
              )}

              {/* Ping */}
              <div className="text-right">
                <div className={`text-xs font-medium ${pingColor}`}>
                  {isLoading ? "⏳" : ping != null ? `${ping}ms` : "—"}
                </div>
              </div>

              {/* Ping Button */}
              <button
                onClick={() => pingServer(server)}
                disabled={isLoading}
                className="rounded-lg bg-surface/50 px-2 py-1 text-[10px] text-text-dim hover:text-text disabled:opacity-50"
              >
                📡
              </button>
            </div>
          );
        })}

        {servers.length === 0 && (
          <div className="py-8 text-center text-sm text-text-dim">Sunucu yok. Önce sunucu ekleyin.</div>
        )}
      </div>
    </div>
  );
}
