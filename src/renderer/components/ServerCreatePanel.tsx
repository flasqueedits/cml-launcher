import React from "react";
import type { LocalServer } from "../../shared/types";

interface Props {
  gameDir: string;
  javaPath: string;
  onStart: (config: LocalServer) => void;
  onStop: () => void;
  running: boolean;
  logs: string[];
}

export function ServerCreatePanel({ gameDir, javaPath, onStart, onStop, running, logs }: Props) {
  const [name, setName] = React.useState("Benim Sunucum");
  const [port, setPort] = React.useState("25565");
  const [maxPlayers, setMaxPlayers] = React.useState("20");
  const [gamemode, setGamemode] = React.useState("survival");
  const [difficulty, setDifficulty] = React.useState("normal");
  const [motd, setMotd] = React.useState("CML Launcher Sunucusu");
  const [ramMb, setRamMb] = React.useState("2048");

  const logRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const handleStart = () => {
    onStart({
      name: name.trim() || "Benim Sunucum",
      port: parseInt(port) || 25565,
      maxPlayers: parseInt(maxPlayers) || 20,
      gamemode,
      difficulty,
      motd: motd.trim() || "CML Launcher Sunucusu",
      version: "",
      running: false,
      javaPath,
      gameDir,
      ramMb: parseInt(ramMb) || 2048,
    });
  };

  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <h2 className="mb-4 text-base font-semibold">Sunucu Oluştur</h2>

      {!running ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-text-dim">Sunucu Adı</label>
              <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-text-dim">Port</label>
              <input className="input-field" value={port} onChange={(e) => setPort(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-text-dim">Maks Oyuncu</label>
              <input className="input-field" value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-text-dim">RAM (MB)</label>
              <input className="input-field" value={ramMb} onChange={(e) => setRamMb(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-text-dim">Oyun Modu</label>
              <select className="input-field" value={gamemode} onChange={(e) => setGamemode(e.target.value)}>
                <option value="survival">Survival</option>
                <option value="creative">Creative</option>
                <option value="adventure">Adventure</option>
                <option value="spectator">Spectator</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-text-dim">Zorluk</label>
              <select className="input-field" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="peaceful">Peaceful</option>
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-text-dim">MOTD</label>
            <input className="input-field" value={motd} onChange={(e) => setMotd(e.target.value)} />
          </div>

          {!javaPath && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
              Java bulunamadı. Ayarlardan Java yolunu belirtin.
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!javaPath}
            className="play-button w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            Sunucuyu Başlat
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-accent">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              Çalışıyor — Port: {port}
            </span>
            <button
              onClick={onStop}
              className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20"
            >
              Durdur
            </button>
          </div>

          <div
            ref={logRef}
            className="max-h-[200px] overflow-y-auto rounded-lg bg-[#0a0a0a] p-3 font-mono text-[10px] leading-relaxed text-text-dim"
          >
            {logs.length === 0 && <div className="text-text-dim">Sunucu logları burada görünecek...</div>}
            {logs.map((l, i) => (
              <div key={i} className="whitespace-pre-wrap">{l}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
